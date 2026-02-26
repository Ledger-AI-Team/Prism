/**
 * Portfolio Backtesting Service
 * 
 * Backtests portfolio allocations using historical market data from Backblaze.
 * Supports:
 * - Multi-asset portfolio construction
 * - Monthly rebalancing
 * - Performance metrics (best/worst/average annual returns)
 * - Growth of $X calculation
 */

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  endpoint: `https://${process.env.BACKBLAZE_ENDPOINT || 's3.us-west-004.backblazeb2.com'}`,
  region: process.env.BACKBLAZE_REGION || 'us-west-004',
  credentials: {
    accessKeyId: process.env.BACKBLAZE_KEY_ID,
    secretAccessKey: process.env.BACKBLAZE_APPLICATION_KEY,
  },
});

const BUCKET_NAME = 'FartherData';

/**
 * Asset class to ticker mapping
 */
const ASSET_TICKERS = {
  stocks: {
    us: 'SPY',      // S&P 500
    intl: 'EFA',    // International developed
    em: 'EEM',      // Emerging markets
  },
  bonds: {
    core: 'AGG',    // Investment grade bonds
    treasury: 'TLT', // Long-term treasuries
  },
  alternatives: {
    reits: 'VNQ',   // Real estate
    gold: 'GLD',    // Gold
  },
  cash: 'SHY',      // Short-term treasuries (cash proxy)
};

class BacktestService {
  /**
   * Backtest a portfolio allocation from startDate to endDate
   * 
   * @param {Object} allocation - { stocks: 60, bonds: 30, alternatives: 5, cash: 5 }
   * @param {number} initialCapital - Starting portfolio value (e.g., 100000)
   * @param {string} startDate - ISO date (e.g., '1999-01-01')
   * @param {string} endDate - ISO date (e.g., '2026-02-25')
   * @param {string} rebalanceFrequency - 'monthly' | 'quarterly' | 'annually'
   * @returns {Object} Backtest results with growth series, annual returns, statistics
   */
  async backtestPortfolio(allocation, initialCapital = 100000, startDate = '1999-01-01', endDate = null, rebalanceFrequency = 'monthly') {
    endDate = endDate || new Date().toISOString().split('T')[0];

    // 1. Load market data for all asset classes
    const marketData = await this.loadMarketData(startDate, endDate);

    // 2. Convert allocation percentages to asset weights
    const assetWeights = this.allocToAssetWeights(allocation);

    // 3. Run backtest simulation
    const results = this.simulateBacktest(marketData, assetWeights, initialCapital, rebalanceFrequency);

    // 4. Calculate performance statistics
    const stats = this.calculateStatistics(results);

    return {
      allocation,
      initialCapital,
      startDate,
      endDate,
      rebalanceFrequency,
      finalValue: results.portfolioValues[results.portfolioValues.length - 1].value,
      totalReturn: ((results.portfolioValues[results.portfolioValues.length - 1].value / initialCapital) - 1) * 100,
      cagr: this.calculateCAGR(initialCapital, results.portfolioValues[results.portfolioValues.length - 1].value, results.years),
      portfolioValues: results.portfolioValues, // Daily/monthly time series
      annualReturns: results.annualReturns,
      statistics: stats,
    };
  }

  /**
   * Load historical market data from Backblaze
   */
  async loadMarketData(startDate, endDate) {
    const tickers = [
      'SPY', 'EFA', 'EEM', 'AGG', 'TLT', 'VNQ', 'GLD',
    ];

    const data = {};

    for (const ticker of tickers) {
      try {
        const key = `market-data/daily-prices/${ticker}.csv`;
        const command = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
        });

        const response = await s3Client.send(command);
        const body = await response.Body.transformToString();
        
        // Parse CSV (date,open,high,low,close,volume)
        const lines = body.trim().split('\n');
        const headers = lines[0].split(',');
        const tickerData = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          if (values.length >= 5) {
            tickerData.push({
              date: values[0],
              close: parseFloat(values[4]),
              return: 0, // Will be calculated if needed
            });
          }
        }

        // Filter by date range
        data[ticker] = tickerData.filter(d => {
          return d.date >= startDate && d.date <= endDate;
        });

        console.log(`[Backtest] Loaded ${ticker}: ${data[ticker].length} days`);
      } catch (error) {
        console.error(`[Backtest] Failed to load ${ticker}:`, error.message);
        throw new Error(`Missing market data for ${ticker}`);
      }
    }

    return data;
  }

  /**
   * Convert allocation percentages to asset-level weights
   * 
   * Example:
   *   { stocks: 60, bonds: 30, alternatives: 5, cash: 5 }
   *   -> { SPY: 0.50, EFA: 0.05, EEM: 0.05, AGG: 0.25, TLT: 0.05, VNQ: 0.03, GLD: 0.02, SHY: 0.05 }
   */
  allocToAssetWeights(allocation) {
    const weights = {};

    // Stocks (60% → 50% SPY, 5% EFA, 5% EEM)
    if (allocation.stocks > 0) {
      weights.SPY = allocation.stocks * 0.833 / 100;  // 83.3% of stocks allocation
      weights.EFA = allocation.stocks * 0.083 / 100;  // 8.3% of stocks
      weights.EEM = allocation.stocks * 0.083 / 100;  // 8.3% of stocks
    }

    // Bonds (30% → 25% AGG, 5% TLT)
    if (allocation.bonds > 0) {
      weights.AGG = allocation.bonds * 0.833 / 100;
      weights.TLT = allocation.bonds * 0.167 / 100;
    }

    // Alternatives (5% → 3% VNQ, 2% GLD)
    if (allocation.alternatives > 0) {
      weights.VNQ = allocation.alternatives * 0.60 / 100;
      weights.GLD = allocation.alternatives * 0.40 / 100;
    }

    // Cash (5% → AGG short-term bonds proxy)
    if (allocation.cash > 0) {
      // Add cash allocation to AGG (aggregate bonds as cash proxy)
      weights.AGG = (weights.AGG || 0) + (allocation.cash / 100);
    }

    return weights;
  }

  /**
   * Simulate portfolio backtest with rebalancing
   */
  simulateBacktest(marketData, assetWeights, initialCapital, rebalanceFrequency) {
    const tickers = Object.keys(assetWeights);
    
    // Get all dates (use SPY as reference)
    const dates = marketData.SPY.map(d => d.date);

    // Initialize portfolio holdings
    let portfolioValue = initialCapital;
    let holdings = {}; // { ticker: shares }

    // Buy initial allocation
    const firstDatePrices = {};
    for (const ticker of tickers) {
      firstDatePrices[ticker] = marketData[ticker][0].close;
      holdings[ticker] = (portfolioValue * assetWeights[ticker]) / firstDatePrices[ticker];
    }

    const portfolioValues = [{ date: dates[0], value: portfolioValue }];
    const annualReturns = [];
    let yearStartValue = portfolioValue;
    let currentYear = parseInt(dates[0].substring(0, 4));

    // Rebalancing schedule
    let lastRebalanceMonth = null;
    let lastRebalanceQuarter = null;
    let lastRebalanceYear = null;

    for (let i = 1; i < dates.length; i++) {
      const date = dates[i];
      const year = parseInt(date.substring(0, 4));
      const month = parseInt(date.substring(5, 7));
      const quarter = Math.ceil(month / 3);

      // Calculate current portfolio value
      portfolioValue = 0;
      const prices = {};
      for (const ticker of tickers) {
        const dayData = marketData[ticker][i];
        if (!dayData) continue;
        prices[ticker] = dayData.close;
        portfolioValue += holdings[ticker] * dayData.close;
      }

      portfolioValues.push({ date, value: portfolioValue });

      // Check for rebalancing
      let shouldRebalance = false;
      if (rebalanceFrequency === 'monthly' && month !== lastRebalanceMonth) {
        shouldRebalance = true;
        lastRebalanceMonth = month;
      } else if (rebalanceFrequency === 'quarterly' && quarter !== lastRebalanceQuarter) {
        shouldRebalance = true;
        lastRebalanceQuarter = quarter;
      } else if (rebalanceFrequency === 'annually' && year !== lastRebalanceYear) {
        shouldRebalance = true;
        lastRebalanceYear = year;
      }

      // Rebalance to target weights
      if (shouldRebalance) {
        for (const ticker of tickers) {
          holdings[ticker] = (portfolioValue * assetWeights[ticker]) / prices[ticker];
        }
      }

      // Track annual returns
      if (year !== currentYear) {
        const annualReturn = ((portfolioValue / yearStartValue) - 1) * 100;
        annualReturns.push({
          year: currentYear,
          return: annualReturn,
          startValue: yearStartValue,
          endValue: portfolioValue,
        });
        currentYear = year;
        yearStartValue = portfolioValue;
      }
    }

    // Final year
    if (currentYear === parseInt(dates[dates.length - 1].substring(0, 4))) {
      const annualReturn = ((portfolioValue / yearStartValue) - 1) * 100;
      annualReturns.push({
        year: currentYear,
        return: annualReturn,
        startValue: yearStartValue,
        endValue: portfolioValue,
      });
    }

    const years = (new Date(dates[dates.length - 1]) - new Date(dates[0])) / (365.25 * 24 * 60 * 60 * 1000);

    return {
      portfolioValues,
      annualReturns,
      years,
    };
  }

  /**
   * Calculate portfolio statistics
   */
  calculateStatistics(results) {
    const returns = results.annualReturns.map(r => r.return);
    
    return {
      bestYear: {
        year: results.annualReturns.reduce((max, r) => r.return > max.return ? r : max).year,
        return: Math.max(...returns),
      },
      worstYear: {
        year: results.annualReturns.reduce((min, r) => r.return < min.return ? r : min).year,
        return: Math.min(...returns),
      },
      averageReturn: returns.reduce((sum, r) => sum + r, 0) / returns.length,
      volatility: this.calculateStdDev(returns),
      positiveYears: returns.filter(r => r > 0).length,
      negativeYears: returns.filter(r => r < 0).length,
    };
  }

  /**
   * Calculate CAGR (Compound Annual Growth Rate)
   */
  calculateCAGR(initialValue, finalValue, years) {
    return (Math.pow(finalValue / initialValue, 1 / years) - 1) * 100;
  }

  /**
   * Calculate standard deviation (volatility)
   */
  calculateStdDev(values) {
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - avg, 2));
    const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Compare multiple allocations side-by-side
   */
  async compareAllocations(allocations, initialCapital = 100000, startDate = '1999-01-01', endDate = null) {
    const results = [];

    for (const allocation of allocations) {
      const result = await this.backtestPortfolio(allocation, initialCapital, startDate, endDate);
      results.push(result);
    }

    return results;
  }
}

export default new BacktestService();
