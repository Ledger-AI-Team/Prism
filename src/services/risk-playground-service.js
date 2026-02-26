/**
 * Risk Playground Service
 * 
 * Interactive "what-if" portfolio builder with real-time stress testing.
 * Users drag sliders to adjust asset allocation → see instant risk/return updates.
 * 
 * Features:
 * 1. Real-time portfolio risk calculation as sliders change
 * 2. Live stress testing (2008, 2020, custom scenarios)
 * 3. Monte Carlo fan charts (10th/50th/90th percentile paths)
 * 4. Goal-based tuning ("need 7.2% return to hit goal")
 * 5. Save/compare multiple scenarios
 */

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import pool from '../db/pool.js';
import fs from 'fs';
import path from 'path';

export class RiskPlaygroundService {
  constructor() {
    // Load Backblaze config
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

    // Capital market assumptions (CMAs)
    this.cmas = {
      stocks: { expectedReturn: 0.10, volatility: 0.18 },
      bonds: { expectedReturn: 0.04, volatility: 0.06 },
      cash: { expectedReturn: 0.02, volatility: 0.01 },
      reits: { expectedReturn: 0.09, volatility: 0.20 },
      gold: { expectedReturn: 0.05, volatility: 0.16 },
    };

    this.marketDataCache = null;
  }

  /**
   * Calculate real-time metrics for a proposed allocation
   */
  async calculateMetrics(allocation, options = {}) {
    const {
      currentValue = 1000000,
      years = 30,
      simulations = 1000, // Reduced for speed (interactive UX)
    } = options;

    await this.loadMarketData();

    // Validate allocation sums to 100%
    const total = Object.values(allocation).reduce((sum, val) => sum + val, 0);
    if (Math.abs(total - 1.0) > 0.01) {
      throw new Error(`Allocation must sum to 100% (got ${(total * 100).toFixed(1)}%)`);
    }

    // Calculate portfolio metrics
    const expectedReturn = this.calculateExpectedReturn(allocation);
    const volatility = this.calculateVolatility(allocation);
    const sharpeRatio = (expectedReturn - 0.02) / volatility; // Assuming 2% risk-free rate
    const riskScore = this.volatilityToRiskScore(volatility);

    // Historical stress tests
    const stressTests = await this.runStressTests(allocation);

    // Monte Carlo projection
    const monteCarlo = await this.runMonteCarlo({
      allocation,
      initialValue: currentValue,
      years,
      simulations,
    });

    return {
      allocation,
      expectedReturn,
      volatility,
      sharpeRatio,
      riskScore,
      stressTests,
      monteCarlo,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Calculate expected portfolio return
   */
  calculateExpectedReturn(allocation) {
    let expectedReturn = 0;
    
    for (const [assetClass, weight] of Object.entries(allocation)) {
      const cma = this.cmas[assetClass];
      if (cma) {
        expectedReturn += cma.expectedReturn * weight;
      }
    }
    
    return expectedReturn;
  }

  /**
   * Calculate portfolio volatility (simplified, assuming correlations)
   */
  calculateVolatility(allocation) {
    // Simplified correlation matrix
    const correlations = {
      stocks: { stocks: 1.0, bonds: -0.1, cash: 0.0, reits: 0.7, gold: 0.0 },
      bonds: { stocks: -0.1, bonds: 1.0, cash: 0.3, reits: -0.05, gold: 0.1 },
      cash: { stocks: 0.0, bonds: 0.3, cash: 1.0, reits: 0.0, gold: 0.0 },
      reits: { stocks: 0.7, bonds: -0.05, cash: 0.0, reits: 1.0, gold: 0.0 },
      gold: { stocks: 0.0, bonds: 0.1, cash: 0.0, reits: 0.0, gold: 1.0 },
    };

    let portfolioVariance = 0;
    const assetClasses = Object.keys(allocation);

    for (const asset1 of assetClasses) {
      for (const asset2 of assetClasses) {
        const weight1 = allocation[asset1] || 0;
        const weight2 = allocation[asset2] || 0;
        const vol1 = (this.cmas[asset1] || { volatility: 0.10 }).volatility;
        const vol2 = (this.cmas[asset2] || { volatility: 0.10 }).volatility;
        const corr = correlations[asset1]?.[asset2] || 0;

        portfolioVariance += weight1 * weight2 * vol1 * vol2 * corr;
      }
    }

    return Math.sqrt(portfolioVariance);
  }

  /**
   * Convert volatility to risk score (0-100)
   */
  volatilityToRiskScore(volatility) {
    // Map 0-30% volatility to 0-100 score
    return Math.min(100, (volatility / 0.30) * 100);
  }

  /**
   * Run historical stress tests for allocation
   */
  async runStressTests(allocation) {
    await this.loadMarketData();

    const scenarios = [
      {
        name: '2008 Financial Crisis',
        period: '2008-09-15_2009-03-09',
        description: 'Lehman collapse → market bottom',
      },
      {
        name: '2020 COVID Crash',
        period: '2020-02-19_2020-03-23',
        description: 'Pandemic-driven collapse',
      },
      {
        name: '2022 Bear Market',
        period: '2022-01-03_2022-10-13',
        description: 'Fed tightening + inflation',
      },
    ];

    const results = [];

    for (const scenario of scenarios) {
      const impact = await this.calculateScenarioImpact(allocation, scenario.period);
      results.push({
        ...scenario,
        portfolioReturn: impact.portfolioReturn,
        marketReturn: impact.marketReturn,
        outperformance: impact.outperformance,
      });
    }

    // Hypothetical 40% crash
    const hypotheticalReturn = this.estimateCrashImpact(allocation, -0.40);
    results.push({
      name: 'Hypothetical 40% Crash',
      description: 'Severe market decline',
      portfolioReturn: hypotheticalReturn,
      marketReturn: -0.40,
      outperformance: hypotheticalReturn - (-0.40),
    });

    return results;
  }

  /**
   * Calculate allocation impact for historical period
   */
  async calculateScenarioImpact(allocation, period) {
    const [startDate, endDate] = period.split('_');
    
    // Calculate returns for each asset class
    const assetReturns = {};
    
    // Map allocation to ticker symbols
    const assetMap = {
      stocks: 'SPY',
      bonds: 'AGG',
      cash: 'AGG', // Approximate
      reits: 'VNQ',
      gold: 'GLD',
    };

    for (const [assetClass, weight] of Object.entries(allocation)) {
      if (weight === 0) continue;
      
      const ticker = assetMap[assetClass];
      const data = this.marketDataCache[ticker];
      
      if (data) {
        const startPrice = this.findPriceOnDate(data, startDate);
        const endPrice = this.findPriceOnDate(data, endDate);
        
        if (startPrice && endPrice) {
          assetReturns[assetClass] = (endPrice - startPrice) / startPrice;
        }
      }
    }

    // Calculate weighted portfolio return
    let portfolioReturn = 0;
    for (const [assetClass, weight] of Object.entries(allocation)) {
      portfolioReturn += (assetReturns[assetClass] || 0) * weight;
    }

    // Market (SPY) return
    const spyData = this.marketDataCache['SPY'];
    const spyStart = this.findPriceOnDate(spyData, startDate);
    const spyEnd = this.findPriceOnDate(spyData, endDate);
    const marketReturn = (spyEnd - spyStart) / spyStart;

    return {
      portfolioReturn,
      marketReturn,
      outperformance: portfolioReturn - marketReturn,
    };
  }

  /**
   * Estimate crash impact based on typical asset class behavior
   */
  estimateCrashImpact(allocation, marketCrashPercent) {
    // Typical asset class behavior in crashes
    const crashBetas = {
      stocks: 1.0,    // Falls with market
      bonds: -0.2,    // Slight gain (flight to safety)
      cash: 0.0,      // No change
      reits: 0.8,     // Falls but less than stocks
      gold: -0.3,     // Often gains
    };

    let portfolioReturn = 0;
    for (const [assetClass, weight] of Object.entries(allocation)) {
      const beta = crashBetas[assetClass] || 1.0;
      portfolioReturn += marketCrashPercent * beta * weight;
    }

    return portfolioReturn;
  }

  /**
   * Run quick Monte Carlo simulation
   */
  async runMonteCarlo({ allocation, initialValue, years, simulations }) {
    const expectedReturn = this.calculateExpectedReturn(allocation);
    const volatility = this.calculateVolatility(allocation);

    const paths = [];
    const finalValues = [];

    for (let sim = 0; sim < simulations; sim++) {
      const path = [initialValue];
      let value = initialValue;

      for (let year = 0; year < years; year++) {
        // Generate random return from normal distribution
        const randomReturn = this.randomNormal(expectedReturn, volatility);
        value *= (1 + randomReturn);
        path.push(value);
      }

      paths.push(path);
      finalValues.push(value);
    }

    // Calculate percentiles
    finalValues.sort((a, b) => a - b);
    
    const p10 = finalValues[Math.floor(simulations * 0.10)];
    const p50 = finalValues[Math.floor(simulations * 0.50)];
    const p90 = finalValues[Math.floor(simulations * 0.90)];

    // Generate percentile paths (for fan chart)
    const percentilePaths = {
      p10: this.calculatePercentilePath(paths, 0.10, years),
      p50: this.calculatePercentilePath(paths, 0.50, years),
      p90: this.calculatePercentilePath(paths, 0.90, years),
    };

    return {
      simulations,
      years,
      expectedFinalValue: p50,
      percentiles: {
        p10,
        p50,
        p90,
      },
      percentilePaths,
      probabilityOf2x: finalValues.filter(v => v >= initialValue * 2).length / simulations,
      probabilityOfLoss: finalValues.filter(v => v < initialValue).length / simulations,
    };
  }

  /**
   * Calculate percentile path across all simulations
   */
  calculatePercentilePath(paths, percentile, years) {
    const path = [];
    
    for (let year = 0; year <= years; year++) {
      const values = paths.map(p => p[year]).sort((a, b) => a - b);
      const index = Math.floor(values.length * percentile);
      path.push(values[index]);
    }
    
    return path;
  }

  /**
   * Generate random number from normal distribution
   */
  randomNormal(mean, stdDev) {
    // Box-Muller transform
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + stdDev * z0;
  }

  /**
   * Load market data from Backblaze
   */
  async loadMarketData() {
    if (this.marketDataCache) return;

    console.log('[RiskPlayground] Loading market data...');

    this.marketDataCache = {};

    const symbols = ['SPY', 'AGG', 'TLT', 'VNQ', 'GLD'];
    
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
        console.warn(`[RiskPlayground] Failed to load ${symbol}:`, error.message);
      }
    }

    console.log(`[RiskPlayground] Loaded ${Object.keys(this.marketDataCache).length} assets`);
  }

  /**
   * Find price on specific date
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
   * Save playground scenario to database
   */
  async saveScenario(householdId, name, allocation, metrics) {
    const result = await pool.query(
      `INSERT INTO playground_scenarios 
       (household_id, name, allocation, expected_return, volatility, risk_score, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING scenario_id`,
      [
        householdId,
        name,
        JSON.stringify(allocation),
        metrics.expectedReturn,
        metrics.volatility,
        metrics.riskScore,
      ]
    );

    return result.rows[0].scenario_id;
  }

  /**
   * Load saved scenarios for household
   */
  async loadScenarios(householdId) {
    const result = await pool.query(
      `SELECT scenario_id, name, allocation, expected_return, volatility, risk_score, created_at
       FROM playground_scenarios
       WHERE household_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [householdId]
    );

    return result.rows.map(row => ({
      id: row.scenario_id,
      name: row.name,
      allocation: row.allocation,
      expectedReturn: parseFloat(row.expected_return),
      volatility: parseFloat(row.volatility),
      riskScore: parseFloat(row.risk_score),
      createdAt: row.created_at,
    }));
  }

  /**
   * Calculate required return to hit goal
   */
  calculateRequiredReturn(currentValue, goalValue, years) {
    // FV = PV * (1 + r)^n
    // r = (FV/PV)^(1/n) - 1
    return Math.pow(goalValue / currentValue, 1 / years) - 1;
  }

  /**
   * Suggest allocation to hit required return
   */
  suggestAllocation(requiredReturn) {
    // Simple rule: Higher return = more stocks
    // Expected returns: stocks 10%, bonds 4%, cash 2%
    
    if (requiredReturn <= 0.02) {
      return { stocks: 0, bonds: 0, cash: 1.0 };
    } else if (requiredReturn <= 0.04) {
      return { stocks: 0, bonds: 1.0, cash: 0 };
    } else if (requiredReturn <= 0.06) {
      return { stocks: 0.33, bonds: 0.67, cash: 0 };
    } else if (requiredReturn <= 0.08) {
      return { stocks: 0.67, bonds: 0.33, cash: 0 };
    } else {
      // Need > 8%, go aggressive
      return { stocks: 0.90, bonds: 0.10, cash: 0 };
    }
  }
}

// Create table if not exists (will run migration separately)
export async function createPlaygroundTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS playground_scenarios (
      scenario_id SERIAL PRIMARY KEY,
      household_id UUID NOT NULL REFERENCES households(household_id),
      name VARCHAR(255) NOT NULL,
      allocation JSONB NOT NULL,
      expected_return NUMERIC(10, 6) NOT NULL,
      volatility NUMERIC(10, 6) NOT NULL,
      risk_score NUMERIC(5, 2) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_playground_household 
    ON playground_scenarios(household_id, created_at DESC);
  `);
  
  console.log('[RiskPlayground] Table created/verified');
}

// Export singleton
export const riskPlaygroundService = new RiskPlaygroundService();
