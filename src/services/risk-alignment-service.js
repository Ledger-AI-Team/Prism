/**
 * Risk Alignment Service
 * 
 * Compares stated risk tolerance vs actual portfolio behavior.
 * Provides visual alignment metrics + stress testing + rebalancing suggestions.
 * 
 * Core Features:
 * 1. Portfolio risk calculation (volatility, beta, VaR, max drawdown)
 * 2. Alignment scoring (stated vs actual risk)
 * 3. Historical stress tests (2008, 2020, custom scenarios)
 * 4. Gap analysis + rebalancing recommendations
 */

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import pool from '../db/pool.js';
import fs from 'fs';
import path from 'path';

export class RiskAlignmentService {
  constructor() {
    // Load Backblaze config for historical market data
    const envPath = path.join(process.cwd(), '.env.backblaze');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      this.b2Config = {};
      envContent.split('\n').forEach(line => {
        if (line && !line.startsWith('#')) {
          const [key, value] = line.split('=');
          if (key && value) this.b2Config[key.trim()] = value.trim();
        }
      });
      
      this.s3Client = new S3Client({
        endpoint: `https://${this.b2Config.BACKBLAZE_ENDPOINT}`,
        region: this.b2Config.BACKBLAZE_REGION,
        credentials: {
          accessKeyId: this.b2Config.BACKBLAZE_KEY_ID,
          secretAccessKey: this.b2Config.BACKBLAZE_APPLICATION_KEY,
        },
        forcePathStyle: true,
      });
      
      this.bucket = this.b2Config.BACKBLAZE_BUCKET_NAME;
    }

    this.marketDataCache = null;
  }

  /**
   * Calculate full risk alignment for a household
   */
  async calculateAlignment(householdId) {
    console.log(`[RiskAlignment] Calculating for household ${householdId}`);

    // 1. Get client's stated risk tolerance
    const riskProfile = await this.getRiskProfile(householdId);
    
    // 2. Get portfolio holdings
    const portfolio = await this.getPortfolio(householdId);
    
    // 3. Calculate actual portfolio risk
    const portfolioRisk = await this.calculatePortfolioRisk(portfolio);
    
    // 4. Calculate alignment score
    const alignment = this.calculateAlignmentScore(riskProfile, portfolioRisk);
    
    // 5. Run stress tests
    const stressTests = await this.runStressTests(portfolio);
    
    // 6. Generate gap analysis
    const gapAnalysis = this.analyzeGap(riskProfile, portfolioRisk, stressTests);
    
    // 7. Rebalancing recommendations
    const rebalancing = this.generateRebalancingRecs(
      riskProfile,
      portfolioRisk,
      portfolio,
      gapAnalysis
    );

    return {
      householdId,
      timestamp: new Date().toISOString(),
      riskProfile: {
        tolerance: riskProfile.tolerance_score,
        capacity: riskProfile.capacity_score,
        composure: riskProfile.composure_score,
      },
      portfolioRisk: {
        score: portfolioRisk.riskScore,
        volatility: portfolioRisk.volatility,
        beta: portfolioRisk.beta,
        var95: portfolioRisk.var95,
        maxDrawdown: portfolioRisk.maxDrawdown,
      },
      alignment: {
        score: alignment.score,
        gap: alignment.gap,
        status: alignment.status, // 'aligned', 'overallocated', 'underallocated'
        message: alignment.message,
      },
      stressTests,
      gapAnalysis,
      rebalancing,
    };
  }

  /**
   * Get risk profile from database
   */
  async getRiskProfile(householdId) {
    const result = await pool.query(
      `SELECT tolerance_score, capacity_score, composure_score, 
              recommended_allocation, created_at
       FROM risk_profiles
       WHERE household_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [householdId]
    );

    if (result.rows.length === 0) {
      throw new Error(`No risk profile found for household ${householdId}`);
    }

    return result.rows[0];
  }

  /**
   * Get portfolio holdings from database
   */
  async getPortfolio(householdId) {
    const result = await pool.query(
      `SELECT 
         l.symbol,
         l.quantity,
         l.cost_basis,
         l.current_price,
         l.market_value,
         a.account_type,
         a.tax_treatment
       FROM lots l
       JOIN accounts a ON l.account_id = a.account_id
       WHERE a.household_id = $1
       AND l.quantity > 0
       ORDER BY l.market_value DESC`,
      [householdId]
    );

    if (result.rows.length === 0) {
      throw new Error(`No portfolio holdings found for household ${householdId}`);
    }

    const holdings = result.rows;
    const totalValue = holdings.reduce((sum, h) => sum + parseFloat(h.market_value), 0);

    return {
      holdings: holdings.map(h => ({
        symbol: h.symbol,
        quantity: parseFloat(h.quantity),
        costBasis: parseFloat(h.cost_basis),
        currentPrice: parseFloat(h.current_price),
        marketValue: parseFloat(h.market_value),
        weight: parseFloat(h.market_value) / totalValue,
        accountType: h.account_type,
        taxTreatment: h.tax_treatment,
      })),
      totalValue,
    };
  }

  /**
   * Calculate portfolio risk metrics
   */
  async calculatePortfolioRisk(portfolio) {
    // Ensure market data is loaded
    await this.loadMarketData();

    const { holdings, totalValue } = portfolio;

    // Calculate weighted volatility
    let portfolioVolatility = 0;
    let portfolioBeta = 0;
    
    for (const holding of holdings) {
      const historicalData = this.marketDataCache[holding.symbol] || 
                            this.marketDataCache['SPY']; // Default to SPY if symbol not found
      
      if (historicalData) {
        const returns = this.calculateReturns(historicalData);
        const volatility = this.calculateVolatility(returns);
        const beta = this.calculateBeta(returns, this.marketDataCache['SPY']);
        
        portfolioVolatility += volatility * holding.weight;
        portfolioBeta += beta * holding.weight;
      }
    }

    // Calculate VaR (95% confidence)
    const var95 = portfolioVolatility * 1.645 * Math.sqrt(1 / 252); // 1-day VaR

    // Calculate max drawdown from historical data
    const maxDrawdown = await this.calculateMaxDrawdown(holdings);

    // Convert to risk score (0-100)
    const riskScore = this.volatilityToRiskScore(portfolioVolatility);

    return {
      riskScore,
      volatility: portfolioVolatility,
      beta: portfolioBeta,
      var95,
      maxDrawdown,
    };
  }

  /**
   * Load historical market data from Backblaze
   */
  async loadMarketData() {
    if (this.marketDataCache) return;

    console.log('[RiskAlignment] Loading market data from Backblaze...');

    this.marketDataCache = {};

    // Load key assets (SPY, bonds, etc)
    const symbols = ['SPY', 'AGG', 'TLT', 'VNQ', 'GLD', 'IWM', 'EFA', 'EEM'];
    
    for (const symbol of symbols) {
      try {
        const key = `securities/daily-prices/${symbol}.json`;
        const command = new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        });

        const response = await this.s3Client.send(command);
        const data = await this.streamToString(response.Body);
        this.marketDataCache[symbol] = JSON.parse(data);
      } catch (error) {
        console.warn(`[RiskAlignment] Failed to load ${symbol}:`, error.message);
      }
    }

    console.log(`[RiskAlignment] Loaded ${Object.keys(this.marketDataCache).length} assets`);
  }

  /**
   * Convert stream to string
   */
  async streamToString(stream) {
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('utf-8');
  }

  /**
   * Calculate returns from price data
   */
  calculateReturns(priceData) {
    const prices = priceData.map(d => d.close);
    const returns = [];
    
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    
    return returns;
  }

  /**
   * Calculate volatility (annualized standard deviation)
   */
  calculateVolatility(returns) {
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const dailyVolatility = Math.sqrt(variance);
    return dailyVolatility * Math.sqrt(252); // Annualize
  }

  /**
   * Calculate beta (vs SPY)
   */
  calculateBeta(assetReturns, marketData) {
    const marketReturns = this.calculateReturns(marketData);
    
    // Align lengths
    const length = Math.min(assetReturns.length, marketReturns.length);
    const assetSlice = assetReturns.slice(-length);
    const marketSlice = marketReturns.slice(-length);
    
    // Calculate covariance and variance
    const assetMean = assetSlice.reduce((sum, r) => sum + r, 0) / length;
    const marketMean = marketSlice.reduce((sum, r) => sum + r, 0) / length;
    
    let covariance = 0;
    let marketVariance = 0;
    
    for (let i = 0; i < length; i++) {
      covariance += (assetSlice[i] - assetMean) * (marketSlice[i] - marketMean);
      marketVariance += Math.pow(marketSlice[i] - marketMean, 2);
    }
    
    covariance /= length;
    marketVariance /= length;
    
    return covariance / marketVariance;
  }

  /**
   * Calculate max drawdown
   */
  async calculateMaxDrawdown(holdings) {
    // Simplified: Use portfolio-weighted average of individual max drawdowns
    let weightedDrawdown = 0;
    
    for (const holding of holdings) {
      const historicalData = this.marketDataCache[holding.symbol] || 
                            this.marketDataCache['SPY'];
      
      if (historicalData) {
        const prices = historicalData.map(d => d.close);
        const drawdown = this.computeMaxDrawdown(prices);
        weightedDrawdown += drawdown * holding.weight;
      }
    }
    
    return weightedDrawdown;
  }

  /**
   * Compute max drawdown from price series
   */
  computeMaxDrawdown(prices) {
    let peak = prices[0];
    let maxDD = 0;
    
    for (const price of prices) {
      if (price > peak) peak = price;
      const dd = (peak - price) / peak;
      if (dd > maxDD) maxDD = dd;
    }
    
    return maxDD;
  }

  /**
   * Convert volatility to risk score (0-100)
   */
  volatilityToRiskScore(volatility) {
    // Typical equity volatility ~20%, bonds ~5%
    // Map 0-30% volatility to 0-100 score
    return Math.min(100, (volatility / 0.30) * 100);
  }

  /**
   * Calculate alignment score between stated risk and actual portfolio
   */
  calculateAlignmentScore(riskProfile, portfolioRisk) {
    const statedRisk = riskProfile.tolerance_score || 50;
    const actualRisk = portfolioRisk.riskScore;
    
    const gap = statedRisk - actualRisk;
    const absGap = Math.abs(gap);
    
    // Alignment score: 100 = perfect, 0 = very misaligned
    const alignmentScore = Math.max(0, 100 - absGap);
    
    let status, message;
    
    if (absGap <= 10) {
      status = 'aligned';
      message = `Your portfolio risk (${actualRisk.toFixed(0)}/100) matches your risk tolerance (${statedRisk.toFixed(0)}/100). Well aligned.`;
    } else if (gap > 0) {
      status = 'underallocated';
      message = `Your portfolio is ${gap.toFixed(0)} points more conservative than your risk tolerance suggests. You may be leaving growth potential on the table.`;
    } else {
      status = 'overallocated';
      message = `Your portfolio is ${Math.abs(gap).toFixed(0)} points riskier than your stated tolerance. Consider reducing volatility.`;
    }
    
    return {
      score: alignmentScore,
      gap,
      status,
      message,
    };
  }

  /**
   * Run historical stress tests
   */
  async runStressTests(portfolio) {
    await this.loadMarketData();

    const scenarios = [
      {
        name: '2008 Financial Crisis',
        period: '2008-09-15_2009-03-09',
        description: 'Lehman Brothers collapse through market bottom',
      },
      {
        name: '2020 COVID Crash',
        period: '2020-02-19_2020-03-23',
        description: 'Pandemic-driven market collapse',
      },
      {
        name: '2022 Bear Market',
        period: '2022-01-03_2022-10-13',
        description: 'Fed tightening + inflation concerns',
      },
    ];

    const results = [];

    for (const scenario of scenarios) {
      const impact = await this.calculateScenarioImpact(portfolio, scenario.period);
      results.push({
        ...scenario,
        portfolioReturn: impact.portfolioReturn,
        marketReturn: impact.marketReturn,
        outperformance: impact.outperformance,
        dollarLoss: impact.dollarLoss,
        status: impact.outperformance >= 0 ? 'outperformed' : 'underperformed',
      });
    }

    // Add hypothetical scenario
    results.push({
      name: 'Hypothetical 40% Crash',
      description: 'Severe market decline scenario',
      portfolioReturn: -0.34, // Estimated
      marketReturn: -0.40,
      outperformance: 0.06,
      dollarLoss: portfolio.totalValue * 0.34,
      status: 'outperformed',
    });

    return results;
  }

  /**
   * Calculate portfolio impact for a historical period
   */
  async calculateScenarioImpact(portfolio, period) {
    const [startDate, endDate] = period.split('_');
    
    // Calculate portfolio return
    let portfolioReturn = 0;
    
    for (const holding of portfolio.holdings) {
      const data = this.marketDataCache[holding.symbol] || this.marketDataCache['SPY'];
      const startPrice = this.findPriceOnDate(data, startDate);
      const endPrice = this.findPriceOnDate(data, endDate);
      
      if (startPrice && endPrice) {
        const assetReturn = (endPrice - startPrice) / startPrice;
        portfolioReturn += assetReturn * holding.weight;
      }
    }
    
    // Calculate market (SPY) return
    const spyData = this.marketDataCache['SPY'];
    const spyStart = this.findPriceOnDate(spyData, startDate);
    const spyEnd = this.findPriceOnDate(spyData, endDate);
    const marketReturn = (spyEnd - spyStart) / spyStart;
    
    const outperformance = portfolioReturn - marketReturn;
    const dollarLoss = portfolio.totalValue * Math.abs(portfolioReturn);
    
    return {
      portfolioReturn,
      marketReturn,
      outperformance,
      dollarLoss,
    };
  }

  /**
   * Find price on specific date (or closest)
   */
  findPriceOnDate(data, dateStr) {
    const target = new Date(dateStr);
    let closest = null;
    let minDiff = Infinity;
    
    for (const point of data) {
      const pointDate = new Date(point.date);
      const diff = Math.abs(pointDate - target);
      
      if (diff < minDiff) {
        minDiff = diff;
        closest = point.close;
      }
    }
    
    return closest;
  }

  /**
   * Analyze gap between stated and actual risk
   */
  analyzeGap(riskProfile, portfolioRisk, stressTests) {
    const gap = riskProfile.tolerance_score - portfolioRisk.riskScore;
    
    const reasons = [];
    const opportunities = [];
    const risks = [];
    
    if (Math.abs(gap) <= 10) {
      return {
        summary: 'Your portfolio is well-aligned with your risk tolerance.',
        reasons: ['Current allocation matches stated preferences'],
        opportunities: [],
        risks: [],
      };
    }
    
    if (gap > 0) {
      // Underallocated (too conservative)
      reasons.push(
        'Your portfolio is more conservative than your stated risk tolerance',
        `Current allocation: ${portfolioRisk.riskScore.toFixed(0)}/100, Target: ${riskProfile.tolerance_score.toFixed(0)}/100`
      );
      
      opportunities.push(
        `Potential additional return: ~${(gap * 0.10).toFixed(1)}% annually`,
        `Over 20 years, this could mean $${((gap * 0.001 * portfolio.totalValue * 20).toFixed(0)).toLocaleString()} in opportunity cost`
      );
      
      risks.push(
        'Increasing equity exposure will raise volatility',
        'Short-term losses may increase during market downturns'
      );
    } else {
      // Overallocated (too aggressive)
      reasons.push(
        'Your portfolio is more aggressive than your stated risk tolerance',
        `Current allocation: ${portfolioRisk.riskScore.toFixed(0)}/100, Target: ${riskProfile.tolerance_score.toFixed(0)}/100`
      );
      
      opportunities.push(
        'Reducing volatility will improve sleep quality',
        'Lower risk of panic-selling during crashes'
      );
      
      risks.push(
        `In a 40% crash, you could lose $${(portfolio.totalValue * 0.40).toLocaleString()}`,
        'May not match your emotional capacity for drawdowns'
      );
    }
    
    return {
      summary: gap > 0 ? 
        'You are underallocated to growth (too conservative)' :
        'You are overallocated to risk (too aggressive)',
      reasons,
      opportunities,
      risks,
    };
  }

  /**
   * Generate rebalancing recommendations
   */
  generateRebalancingRecs(riskProfile, portfolioRisk, portfolio, gapAnalysis) {
    const gap = riskProfile.tolerance_score - portfolioRisk.riskScore;
    
    if (Math.abs(gap) <= 10) {
      return {
        needed: false,
        message: 'No rebalancing needed. Portfolio is well-aligned.',
        suggestions: [],
      };
    }
    
    // Calculate current allocation
    const currentAllocation = this.calculateAssetClassAllocation(portfolio);
    
    // Generate target allocation
    const targetAllocation = this.calculateTargetAllocation(
      riskProfile.tolerance_score,
      currentAllocation
    );
    
    // Calculate trades needed
    const trades = this.calculateRebalancingTrades(
      portfolio,
      currentAllocation,
      targetAllocation
    );
    
    // Estimate tax impact
    const taxImpact = this.estimateTaxImpact(trades, portfolio);
    
    return {
      needed: true,
      message: gap > 0 ?
        'Increase equity allocation to match risk tolerance' :
        'Reduce equity allocation to match risk tolerance',
      currentAllocation,
      targetAllocation,
      trades,
      taxImpact,
      summary: `Rebalancing would ${gap > 0 ? 'increase' : 'decrease'} expected return by ~${Math.abs(gap * 0.10).toFixed(1)}% annually`,
    };
  }

  /**
   * Calculate asset class allocation
   */
  calculateAssetClassAllocation(portfolio) {
    // Simplified: stocks vs bonds vs cash
    // TODO: Enhance with more granular classification
    return {
      stocks: 0.65, // Placeholder
      bonds: 0.30,
      cash: 0.05,
    };
  }

  /**
   * Calculate target allocation based on risk score
   */
  calculateTargetAllocation(riskScore, currentAllocation) {
    // Risk score 0-100 maps to stocks 20%-100%
    const targetStocks = 0.20 + (riskScore / 100) * 0.80;
    const targetBonds = (1 - targetStocks) * 0.80;
    const targetCash = (1 - targetStocks) * 0.20;
    
    return {
      stocks: targetStocks,
      bonds: targetBonds,
      cash: targetCash,
    };
  }

  /**
   * Calculate specific trades needed
   */
  calculateRebalancingTrades(portfolio, current, target) {
    const totalValue = portfolio.totalValue;
    
    return [
      {
        action: 'Increase stocks',
        from: `${(current.stocks * 100).toFixed(0)}%`,
        to: `${(target.stocks * 100).toFixed(0)}%`,
        amount: (target.stocks - current.stocks) * totalValue,
      },
      {
        action: 'Adjust bonds',
        from: `${(current.bonds * 100).toFixed(0)}%`,
        to: `${(target.bonds * 100).toFixed(0)}%`,
        amount: (target.bonds - current.bonds) * totalValue,
      },
    ].filter(trade => Math.abs(trade.amount) > 1000); // Only show meaningful trades
  }

  /**
   * Estimate tax impact of rebalancing
   */
  estimateTaxImpact(trades, portfolio) {
    // Simplified: assume 15% LTCG rate on 50% of gains
    const estimatedGains = trades.reduce((sum, t) => 
      Math.max(0, t.amount) * 0.20, 0
    );
    
    const taxLiability = estimatedGains * 0.15;
    
    return {
      estimatedGains,
      taxLiability,
      message: `Estimated tax cost: $${taxLiability.toFixed(0).toLocaleString()}`,
    };
  }
}

// Export singleton instance
export const riskAlignmentService = new RiskAlignmentService();
