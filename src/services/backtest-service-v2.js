/**
 * Portfolio Backtesting Service V2
 * 
 * Enhanced with:
 * - Redis caching for common allocations
 * - Full asset class granularity (not just stocks/bonds/alts/cash)
 * - Max drawdown calculation
 * - Crisis period identification
 * - Volatility bands
 * - Monthly data aggregation option
 */

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from 'redis';
import crypto from 'crypto';

const s3Client = new S3Client({
  endpoint: `https://${process.env.BACKBLAZE_ENDPOINT || 's3.us-west-004.backblazeb2.com'}`,
  region: process.env.BACKBLAZE_REGION || 'us-west-004',
  credentials: {
    accessKeyId: process.env.BACKBLAZE_KEY_ID,
    secretAccessKey: process.env.BACKBLAZE_APPLICATION_KEY,
  },
});

// Redis client for caching
let redisClient = null;
const CACHE_TTL = 86400; // 24 hours
const CACHE_ENABLED = process.env.REDIS_URL ? true : false;

if (CACHE_ENABLED) {
  redisClient = createClient({ url: process.env.REDIS_URL });
  redisClient.on('error', (err) => console.error('[Redis] Error:', err));
  redisClient.connect().catch(console.error);
}

const BUCKET_NAME = 'FartherData';

/**
 * Full asset class to ticker mapping
 */
const ASSET_CLASS_TICKERS = {
  // Equities
  'US_LARGE_CAP': 'SPY',           // S&P 500
  'US_MID_CAP': 'IWM',             // Russell 2000 (small/mid cap proxy)
  'US_SMALL_CAP': 'IWM',           // Russell 2000
  'US_EQUITY': 'SPY',              // Aggregate US equity
  'INTL_DEVELOPED': 'EFA',         // EAFE (Europe, Australasia, Far East)
  'INTL_EQUITY': 'EFA',            // Aggregate international
  'EMERGING_MARKETS': 'EEM',       // Emerging markets
  'GLOBAL_EQUITY': 'SPY',          // Global (weighted to US)
  
  // Fixed Income
  'CORE_BONDS': 'AGG',             // US aggregate bonds
  'INVESTMENT_GRADE': 'AGG',       // Investment grade bonds
  'GOVERNMENT_BONDS': 'AGG',       // Government bonds
  'TREASURY_LONG': 'TLT',          // Long-term treasuries
  'TREASURY_SHORT': 'AGG',         // Short-term treasuries (use AGG proxy)
  'FIXED_INCOME': 'AGG',           // Aggregate fixed income
  
  // Alternatives
  'REAL_ESTATE': 'VNQ',            // REITs
  'COMMODITIES': 'GLD',            // Gold as commodities proxy
  'GOLD': 'GLD',                   // Gold
  'ALTERNATIVES': 'VNQ',           // Aggregate alternatives
  
  // Cash
  'CASH': 'AGG',                   // Short-term bonds as cash proxy
  'MONEY_MARKET': 'AGG',           // Money market proxy
};

/**
 * Crisis periods for annotations
 */
const CRISIS_PERIODS = [
  { name: 'Dot-com Crash', start: '2000-03-01', end: '2002-10-01', color: '#ef4444' },
  { name: '2008 Financial Crisis', start: '2007-10-01', end: '2009-03-01', color: '#dc2626' },
  { name: 'COVID-19 Crash', start: '2020-02-01', end: '2020-03-31', color: '#f97316' },
  { name: '2022 Bear Market', start: '2022-01-01', end: '2022-10-01', color: '#fb923c' },
];

class BacktestServiceV2 {
  /**
   * Backtest a portfolio allocation from startDate to endDate
   * 
   * @param {Array} allocation - [{ assetClassId: 'US_EQUITY', weight: 0.60 }, ...]
   * @param {number} initialCapital - Starting portfolio value
   * @param {string} startDate - ISO date
   * @param {string} endDate - ISO date
   * @param {Object} options - { rebalanceFrequency, granularity, includeVolatilityBands }
   */
  async backtestPortfolio(allocation, initialCapital = 100000, startDate = '1999-01-01', endDate = null, options = {}) {
    endDate = endDate || new Date().toISOString().split('T')[0];
    const {
      rebalanceFrequency = 'monthly',
      granularity = 'daily', // 'daily' or 'monthly'
      includeVolatilityBands = true,
    } = options;

    // Check cache
    const cacheKey = this.getCacheKey(allocation, initialCapital, startDate, endDate, options);
    if (CACHE_ENABLED && redisClient) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          console.log('[Backtest] Cache hit:', cacheKey);
          return JSON.parse(cached);
        }
      } catch (err) {
        console.error('[Backtest] Cache read error:', err);
      }
    }

    console.log('[Backtest] Cache miss, computing...');

    // 1. Validate allocation
    this.validateAllocation(allocation);

    // 2. Load market data
    const marketData = await this.loadMarketData(startDate, endDate, allocation);

    // 3. Run backtest simulation
    const results = this.simulateBacktest(marketData, allocation, initialCapital, rebalanceFrequency);

    // 4. Calculate statistics
    const stats = this.calculateStatistics(results);

    // 5. Calculate max drawdown
    const drawdown = this.calculateMaxDrawdown(results.portfolioValues);

    // 6. Identify crisis periods
    const crisisImpact = this.analyzeCrisisPeriods(results.portfolioValues);

    // 7. Calculate volatility bands (optional)
    let volatilityBands = null;
    if (includeVolatilityBands) {
      volatilityBands = this.calculateVolatilityBands(results.portfolioValues, stats.volatility);
    }

    // 8. Aggregate to monthly if requested
    let portfolioValues = results.portfolioValues;
    if (granularity === 'monthly') {
      portfolioValues = this.aggregateToMonthly(results.portfolioValues);
    }

    const response = {
      allocation,
      initialCapital,
      startDate,
      endDate,
      rebalanceFrequency,
      finalValue: results.portfolioValues[results.portfolioValues.length - 1].value,
      totalReturn: ((results.portfolioValues[results.portfolioValues.length - 1].value / initialCapital) - 1) * 100,
      cagr: this.calculateCAGR(initialCapital, results.portfolioValues[results.portfolioValues.length - 1].value, results.years),
      portfolioValues,
      annualReturns: results.annualReturns,
      statistics: stats,
      maxDrawdown: drawdown,
      crisisImpact,
      volatilityBands,
      metadata: {
        dataPoints: results.portfolioValues.length,
        granularity,
        cached: false,
      },
    };

    // Store in cache
    if (CACHE_ENABLED && redisClient) {
      try {
        await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(response));
        console.log('[Backtest] Cached result:', cacheKey);
      } catch (err) {
        console.error('[Backtest] Cache write error:', err);
      }
    }

    return response;
  }

  /**
   * Generate cache key
   */
  getCacheKey(allocation, initialCapital, startDate, endDate, options) {
    const payload = JSON.stringify({ allocation, initialCapital, startDate, endDate, options });
    return `backtest:${crypto.createHash('sha256').update(payload).digest('hex').substring(0, 16)}`;
  }

  /**
   * Validate allocation
   */
  validateAllocation(allocation) {
    if (!Array.isArray(allocation) || allocation.length === 0) {
      throw new Error('Allocation must be a non-empty array');
    }

    const total = allocation.reduce((sum, item) => sum + item.weight, 0);
    if (Math.abs(total - 1.0) > 0.01) {
      throw new Error(`Allocation weights must sum to 1.0 (got ${total})`);
    }

    for (const item of allocation) {
      if (!ASSET_CLASS_TICKERS[item.assetClassId]) {
        throw new Error(`Unknown asset class: ${item.assetClassId}`);
      }
    }
  }

  /**
   * Load historical market data from Backblaze
   */
  async loadMarketData(startDate, endDate, allocation) {
    // Get unique tickers needed
    const tickers = [...new Set(allocation.map(a => ASSET_CLASS_TICKERS[a.assetClassId]))];

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
        
        // Parse CSV
        const lines = body.trim().split('\n');
        const tickerData = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          if (values.length >= 5) {
            tickerData.push({
              date: values[0],
              close: parseFloat(values[4]),
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
   * Simulate portfolio backtest with rebalancing
   */
  simulateBacktest(marketData, allocation, initialCapital, rebalanceFrequency) {
    // Map allocation to tickers
    const tickerWeights = {};
    for (const item of allocation) {
      const ticker = ASSET_CLASS_TICKERS[item.assetClassId];
      tickerWeights[ticker] = (tickerWeights[ticker] || 0) + item.weight;
    }

    const tickers = Object.keys(tickerWeights);
    
    // Get all dates (use first ticker as reference)
    const dates = marketData[tickers[0]].map(d => d.date);

    // Initialize portfolio holdings
    let portfolioValue = initialCapital;
    let holdings = {};

    // Buy initial allocation
    const firstDatePrices = {};
    for (const ticker of tickers) {
      firstDatePrices[ticker] = marketData[ticker][0].close;
      holdings[ticker] = (portfolioValue * tickerWeights[ticker]) / firstDatePrices[ticker];
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
          holdings[ticker] = (portfolioValue * tickerWeights[ticker]) / prices[ticker];
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
   * Calculate max drawdown
   */
  calculateMaxDrawdown(portfolioValues) {
    let maxDrawdown = 0;
    let peak = portfolioValues[0].value;
    let peakDate = portfolioValues[0].date;
    let troughDate = portfolioValues[0].date;
    let recoveryDate = null;

    for (let i = 0; i < portfolioValues.length; i++) {
      const value = portfolioValues[i].value;
      const date = portfolioValues[i].date;

      if (value > peak) {
        peak = value;
        peakDate = date;
        if (maxDrawdown > 0 && recoveryDate === null) {
          recoveryDate = date;
        }
      }

      const drawdown = ((value - peak) / peak) * 100;
      if (drawdown < maxDrawdown) {
        maxDrawdown = drawdown;
        troughDate = date;
        recoveryDate = null;
      }
    }

    return {
      maxDrawdown: Math.abs(maxDrawdown),
      peakDate,
      troughDate,
      recoveryDate,
      peakValue: peak,
      troughValue: portfolioValues.find(p => p.date === troughDate)?.value || 0,
    };
  }

  /**
   * Analyze crisis period impacts
   */
  analyzeCrisisPeriods(portfolioValues) {
    const impacts = [];

    for (const crisis of CRISIS_PERIODS) {
      const startIdx = portfolioValues.findIndex(p => p.date >= crisis.start);
      const endIdx = portfolioValues.findIndex(p => p.date >= crisis.end);

      if (startIdx === -1 || endIdx === -1) continue;

      const startValue = portfolioValues[startIdx].value;
      const endValue = portfolioValues[endIdx].value;
      const returnPct = ((endValue - startValue) / startValue) * 100;

      // Find lowest point during crisis
      let lowestValue = startValue;
      let lowestDate = crisis.start;
      for (let i = startIdx; i <= endIdx; i++) {
        if (portfolioValues[i].value < lowestValue) {
          lowestValue = portfolioValues[i].value;
          lowestDate = portfolioValues[i].date;
        }
      }
      const maxDrawdownDuringCrisis = ((lowestValue - startValue) / startValue) * 100;

      impacts.push({
        name: crisis.name,
        start: crisis.start,
        end: crisis.end,
        startValue,
        endValue,
        lowestValue,
        lowestDate,
        return: returnPct,
        maxDrawdown: Math.abs(maxDrawdownDuringCrisis),
        color: crisis.color,
      });
    }

    return impacts;
  }

  /**
   * Calculate volatility bands (±1 std dev)
   */
  calculateVolatilityBands(portfolioValues, annualVolatility) {
    // Convert annual volatility to daily
    const dailyVol = annualVolatility / Math.sqrt(252);
    
    const bands = [];
    let cumReturn = 0;

    for (let i = 0; i < portfolioValues.length; i++) {
      if (i === 0) {
        bands.push({
          date: portfolioValues[i].date,
          upper: portfolioValues[i].value,
          lower: portfolioValues[i].value,
        });
        continue;
      }

      const dailyReturn = (portfolioValues[i].value - portfolioValues[i - 1].value) / portfolioValues[i - 1].value;
      cumReturn += dailyReturn;

      const expectedValue = portfolioValues[0].value * (1 + cumReturn);
      const stdDev = expectedValue * (dailyVol * Math.sqrt(i));

      bands.push({
        date: portfolioValues[i].date,
        upper: expectedValue + stdDev,
        lower: Math.max(0, expectedValue - stdDev),
      });
    }

    return bands;
  }

  /**
   * Aggregate daily data to monthly
   */
  aggregateToMonthly(portfolioValues) {
    const monthly = [];
    let lastMonth = null;

    for (const pv of portfolioValues) {
      const month = pv.date.substring(0, 7); // YYYY-MM
      if (month !== lastMonth) {
        monthly.push(pv);
        lastMonth = month;
      }
    }

    // Always include the last data point
    if (monthly[monthly.length - 1].date !== portfolioValues[portfolioValues.length - 1].date) {
      monthly.push(portfolioValues[portfolioValues.length - 1]);
    }

    return monthly;
  }

  /**
   * Calculate CAGR
   */
  calculateCAGR(initialValue, finalValue, years) {
    return (Math.pow(finalValue / initialValue, 1 / years) - 1) * 100;
  }

  /**
   * Calculate standard deviation
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
  async compareAllocations(allocations, initialCapital = 100000, startDate = '1999-01-01', endDate = null, options = {}) {
    const results = [];

    for (const allocation of allocations) {
      const result = await this.backtestPortfolio(allocation, initialCapital, startDate, endDate, options);
      results.push(result);
    }

    return results;
  }

  /**
   * Convert simple allocation format to detailed format
   * Legacy support: { stocks: 60, bonds: 30, alternatives: 5, cash: 5 }
   */
  static convertSimpleAllocation(simpleAlloc) {
    const allocation = [];

    if (simpleAlloc.stocks > 0) {
      allocation.push({ assetClassId: 'US_EQUITY', weight: simpleAlloc.stocks * 0.70 / 100 });
      allocation.push({ assetClassId: 'INTL_DEVELOPED', weight: simpleAlloc.stocks * 0.20 / 100 });
      allocation.push({ assetClassId: 'EMERGING_MARKETS', weight: simpleAlloc.stocks * 0.10 / 100 });
    }

    if (simpleAlloc.bonds > 0) {
      allocation.push({ assetClassId: 'CORE_BONDS', weight: simpleAlloc.bonds * 0.80 / 100 });
      allocation.push({ assetClassId: 'TREASURY_LONG', weight: simpleAlloc.bonds * 0.20 / 100 });
    }

    if (simpleAlloc.alternatives > 0) {
      allocation.push({ assetClassId: 'REAL_ESTATE', weight: simpleAlloc.alternatives * 0.60 / 100 });
      allocation.push({ assetClassId: 'COMMODITIES', weight: simpleAlloc.alternatives * 0.40 / 100 });
    }

    if (simpleAlloc.cash > 0) {
      allocation.push({ assetClassId: 'CASH', weight: simpleAlloc.cash / 100 });
    }

    return allocation;
  }
}

export default new BacktestServiceV2();
export { ASSET_CLASS_TICKERS, CRISIS_PERIODS };
