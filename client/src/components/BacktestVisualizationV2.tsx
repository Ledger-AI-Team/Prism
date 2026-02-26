/**
 * Enhanced Backtest Visualization Component V2
 * 
 * Features:
 * - Historical performance chart with crisis annotations
 * - Volatility bands (±1 std dev)
 * - Interactive slider to adjust allocation ±10%
 * - Performance statistics (best/worst/average)
 * - Max drawdown analysis
 * - "Stomach test" visualization (crisis period impacts)
 * - Full asset class granularity
 */

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area, AreaChart, BarChart, Bar } from 'recharts';

interface AllocationItem {
  assetClassId: string;
  weight: number;
}

interface BacktestResult {
  allocation: AllocationItem[];
  initialCapital: number;
  finalValue: number;
  totalReturn: number;
  cagr: number;
  portfolioValues: { date: string; value: number }[];
  annualReturns: { year: number; return: number }[];
  statistics: {
    bestYear: { year: number; return: number };
    worstYear: { year: number; return: number };
    averageReturn: number;
    volatility: number;
    positiveYears: number;
    negativeYears: number;
  };
  maxDrawdown: {
    maxDrawdown: number;
    peakDate: string;
    troughDate: string;
    recoveryDate: string | null;
    peakValue: number;
    troughValue: number;
  };
  crisisImpact: Array<{
    name: string;
    start: string;
    end: string;
    return: number;
    maxDrawdown: number;
    color: string;
  }>;
  volatilityBands?: Array<{
    date: string;
    upper: number;
    lower: number;
  }> | null;
}

interface Props {
  baseAllocation: AllocationItem[];
  onAllocationChange?: (allocation: AllocationItem[]) => void;
}

export default function BacktestVisualizationV2({ baseAllocation, onAllocationChange }: Props) {
  const [adjustment, setAdjustment] = useState(0); // -10, 0, +10
  const [backtestData, setBacktestData] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVolatilityBands, setShowVolatilityBands] = useState(true);
  const [selectedView, setSelectedView] = useState<'growth' | 'crisis' | 'drawdown'>('growth');

  // Calculate adjusted allocation based on slider
  const getAdjustedAllocation = (adj: number): AllocationItem[] => {
    // Find equity and bond components
    const equityClasses = ['US_EQUITY', 'INTL_DEVELOPED', 'EMERGING_MARKETS', 'US_LARGE_CAP', 'US_MID_CAP', 'US_SMALL_CAP'];
    const bondClasses = ['CORE_BONDS', 'INVESTMENT_GRADE', 'GOVERNMENT_BONDS', 'TREASURY_LONG', 'FIXED_INCOME'];

    const newAllocation = baseAllocation.map(item => ({ ...item }));

    // Calculate total equity and bond weights
    const equityWeight = newAllocation.filter(a => equityClasses.includes(a.assetClassId)).reduce((sum, a) => sum + a.weight, 0);
    const bondWeight = newAllocation.filter(a => bondClasses.includes(a.assetClassId)).reduce((sum, a) => sum + a.weight, 0);

    if (equityWeight === 0 || bondWeight === 0) {
      return newAllocation; // Can't adjust
    }

    const adjWeight = adj / 100;

    // Adjust equity up/down
    for (const item of newAllocation) {
      if (equityClasses.includes(item.assetClassId)) {
        const proportion = item.weight / equityWeight;
        item.weight += adjWeight * proportion;
        item.weight = Math.max(0, Math.min(1, item.weight));
      } else if (bondClasses.includes(item.assetClassId)) {
        const proportion = item.weight / bondWeight;
        item.weight -= adjWeight * proportion;
        item.weight = Math.max(0, Math.min(1, item.weight));
      }
    }

    // Normalize to 1.0
    const total = newAllocation.reduce((sum, a) => sum + a.weight, 0);
    newAllocation.forEach(item => {
      item.weight = item.weight / total;
    });

    return newAllocation;
  };

  // Fetch backtest data
  const runBacktest = async (allocation: AllocationItem[]) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/backtest/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allocation,
          initialCapital: 100000,
          startDate: '1999-01-01',
          options: {
            rebalanceFrequency: 'monthly',
            granularity: 'daily',
            includeVolatilityBands: true,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Backtest failed: ${response.statusText}`);
      }

      const data = await response.json();
      setBacktestData(data);
      
      if (onAllocationChange) {
        onAllocationChange(allocation);
      }
    } catch (err: any) {
      console.error('[Backtest] Error:', err);
      setError(err.message || 'Failed to run backtest');
    } finally {
      setLoading(false);
    }
  };

  // Run backtest when adjustment changes
  useEffect(() => {
    const allocation = getAdjustedAllocation(adjustment);
    runBacktest(allocation);
  }, [adjustment]);

  if (loading && !backtestData) {
    return (
      <div className="bg-[#5b6a71] rounded-lg p-6 border border-[#6d9dbe]/20">
        <div className="text-center text-white py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a7a82] mx-auto mb-4"></div>
          <p>Running historical backtest with crisis analysis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#5b6a71] rounded-lg p-6 border border-red-500/50">
        <div className="text-red-400">
          <p className="font-bold mb-2">❌ Backtest Error</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!backtestData) return null;

  const currentAllocation = getAdjustedAllocation(adjustment);

  // Prepare chart data (sample for performance)
  const chartData = backtestData.portfolioValues
    .filter((_, idx) => idx % 10 === 0)
    .map((d, idx) => {
      const bandData = backtestData.volatilityBands?.[idx * 10];
      return {
        date: new Date(d.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        value: d.value,
        upperBand: bandData?.upper,
        lowerBand: bandData?.lower,
      };
    });

  return (
    <div className="space-y-6">
      {/* View Selector */}
      <div className="bg-[#5b6a71] rounded-lg p-4 border border-[#6d9dbe]/20">
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedView('growth')}
            className={`px-4 py-2 rounded-lg transition ${
              selectedView === 'growth'
                ? 'bg-[#1a7a82] text-white'
                : 'bg-[#333333] text-[#6d9dbe] hover:bg-[#5b6a71]'
            }`}
          >
            📈 Growth Over Time
          </button>
          <button
            onClick={() => setSelectedView('crisis')}
            className={`px-4 py-2 rounded-lg transition ${
              selectedView === 'crisis'
                ? 'bg-[#1a7a82] text-white'
                : 'bg-[#333333] text-[#6d9dbe] hover:bg-[#5b6a71]'
            }`}
          >
            🔥 Stomach Test (Crises)
          </button>
          <button
            onClick={() => setSelectedView('drawdown')}
            className={`px-4 py-2 rounded-lg transition ${
              selectedView === 'drawdown'
                ? 'bg-[#1a7a82] text-white'
                : 'bg-[#333333] text-[#6d9dbe] hover:bg-[#5b6a71]'
            }`}
          >
            📉 Max Drawdown
          </button>
        </div>
      </div>

      {/* Historical Performance Chart */}
      {selectedView === 'growth' && (
        <div className="bg-[#5b6a71] rounded-lg p-6 border border-[#6d9dbe]/20">
          <div className="mb-4 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">
                Historical Performance (1999-Present)
              </h3>
              <p className="text-[#6d9dbe] text-sm">
                Growth of $100,000 invested on January 1, 1999
              </p>
            </div>
            <label className="flex items-center space-x-2 text-sm text-white">
              <input
                type="checkbox"
                checked={showVolatilityBands}
                onChange={(e) => setShowVolatilityBands(e.target.checked)}
                className="rounded"
              />
              <span>Show Volatility Bands</span>
            </label>
          </div>

          {/* Allocation Slider */}
          <div className="mb-6 p-4 bg-[#333333] rounded-lg">
            <div className="mb-3">
              <label className="text-white font-medium mb-2 block">
                Adjust Risk Level (±10%)
              </label>
              <div className="flex items-center space-x-4">
                <span className="text-[#6d9dbe] text-sm w-32">More Conservative</span>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="5"
                  value={adjustment}
                  onChange={(e) => setAdjustment(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-[#6d9dbe] text-sm w-32 text-right">More Aggressive</span>
              </div>
              <div className="text-center mt-2">
                <span className="text-white font-medium">
                  {adjustment === 0 ? 'Recommended' : `${adjustment > 0 ? '+' : ''}${adjustment}%`}
                </span>
              </div>
            </div>
          </div>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={450}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1a7a82" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#1a7a82" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#6d9dbe20" />
              <XAxis
                dataKey="date"
                stroke="#6d9dbe"
                tick={{ fill: '#6d9dbe', fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="#6d9dbe"
                tick={{ fill: '#6d9dbe', fontSize: 11 }}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}K`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#333333',
                  border: '1px solid #6d9dbe',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [`$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 'Portfolio Value']}
              />
              <Legend />
              
              {showVolatilityBands && backtestData.volatilityBands && (
                <>
                  <Area
                    type="monotone"
                    dataKey="upperBand"
                    stroke="none"
                    fill="#6d9dbe"
                    fillOpacity={0.1}
                    name="Upper Band (+1σ)"
                  />
                  <Area
                    type="monotone"
                    dataKey="lowerBand"
                    stroke="none"
                    fill="#6d9dbe"
                    fillOpacity={0.1}
                    name="Lower Band (-1σ)"
                  />
                </>
              )}
              
              <Area
                type="monotone"
                dataKey="value"
                stroke="#1a7a82"
                strokeWidth={2}
                fill="url(#valueGradient)"
                name="Portfolio Value"
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Performance Summary */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-[#6d9dbe] text-sm mb-1">Final Value</div>
              <div className="text-white font-bold text-xl">
                ${backtestData.finalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[#6d9dbe] text-sm mb-1">Total Return</div>
              <div className="text-white font-bold text-xl">
                {backtestData.totalReturn.toFixed(1)}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-[#6d9dbe] text-sm mb-1">CAGR</div>
              <div className="text-white font-bold text-xl">
                {backtestData.cagr.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stomach Test - Crisis Periods */}
      {selectedView === 'crisis' && (
        <div className="bg-[#5b6a71] rounded-lg p-6 border border-[#6d9dbe]/20">
          <h3 className="text-xl font-bold text-white mb-4">
            🔥 Stomach Test: How Your Portfolio Held Up During Crises
          </h3>
          <p className="text-[#6d9dbe] mb-6">
            Historical performance during major market downturns. Can you handle these swings?
          </p>

          <div className="space-y-4">
            {backtestData.crisisImpact.map((crisis, idx) => (
              <div
                key={idx}
                className="bg-[#333333] rounded-lg p-4 border-l-4"
                style={{ borderColor: crisis.color }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-white font-bold text-lg">{crisis.name}</h4>
                    <p className="text-[#6d9dbe] text-sm">
                      {new Date(crisis.start).toLocaleDateString()} → {new Date(crisis.end).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${crisis.return >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {crisis.return >= 0 ? '+' : ''}{crisis.return.toFixed(1)}%
                    </div>
                    <div className="text-[#6d9dbe] text-sm">Period Return</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-[#6d9dbe]">Max Drawdown:</span>
                    <span className="text-red-400 font-bold ml-2">-{crisis.maxDrawdown.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-[#333333] rounded-lg">
            <p className="text-white text-sm">
              <strong>Investor Takeaway:</strong> This portfolio experienced significant volatility during major crises.
              The "stomach test" asks: could you stay invested through a -{backtestData.maxDrawdown.maxDrawdown.toFixed(1)}% drawdown?
              Historical returns assume you held through all downturns.
            </p>
          </div>
        </div>
      )}

      {/* Max Drawdown Analysis */}
      {selectedView === 'drawdown' && (
        <div className="bg-[#5b6a71] rounded-lg p-6 border border-[#6d9dbe]/20">
          <h3 className="text-xl font-bold text-white mb-4">
            📉 Maximum Drawdown Analysis
          </h3>
          <p className="text-[#6d9dbe] mb-6">
            The largest peak-to-trough decline in portfolio value over the period.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#333333] rounded-lg p-4">
              <div className="text-red-400 text-sm mb-2">Maximum Drawdown</div>
              <div className="text-white font-bold text-3xl mb-1">
                -{backtestData.maxDrawdown.maxDrawdown.toFixed(1)}%
              </div>
              <div className="text-[#6d9dbe] text-xs">Largest decline from peak</div>
            </div>

            <div className="bg-[#333333] rounded-lg p-4">
              <div className="text-[#6d9dbe] text-sm mb-2">Peak → Trough</div>
              <div className="text-white font-medium text-sm mb-2">
                {new Date(backtestData.maxDrawdown.peakDate).toLocaleDateString()}
                <br />↓<br />
                {new Date(backtestData.maxDrawdown.troughDate).toLocaleDateString()}
              </div>
              <div className="text-[#6d9dbe] text-xs">
                ${backtestData.maxDrawdown.peakValue.toLocaleString()} → ${backtestData.maxDrawdown.troughValue.toLocaleString()}
              </div>
            </div>

            <div className="bg-[#333333] rounded-lg p-4">
              <div className="text-[#6d9dbe] text-sm mb-2">Recovery</div>
              <div className="text-white font-medium text-sm">
                {backtestData.maxDrawdown.recoveryDate
                  ? new Date(backtestData.maxDrawdown.recoveryDate).toLocaleDateString()
                  : 'Not yet recovered'}
              </div>
              <div className="text-[#6d9dbe] text-xs">
                {backtestData.maxDrawdown.recoveryDate
                  ? `${Math.floor((new Date(backtestData.maxDrawdown.recoveryDate).getTime() - new Date(backtestData.maxDrawdown.troughDate).getTime()) / (1000 * 60 * 60 * 24 * 30))} months to recover`
                  : 'Ongoing drawdown period'}
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-[#333333] rounded-lg">
            <p className="text-white text-sm">
              <strong>What this means:</strong> At the worst point, your portfolio was down {backtestData.maxDrawdown.maxDrawdown.toFixed(1)}% from its peak.
              {backtestData.maxDrawdown.recoveryDate
                ? ` It took approximately ${Math.floor((new Date(backtestData.maxDrawdown.recoveryDate).getTime() - new Date(backtestData.maxDrawdown.troughDate).getTime()) / (1000 * 60 * 60 * 24 * 365 * 0.25))} months to fully recover.`
                : ' Full recovery has not yet occurred.'}
              This is a key metric for understanding the risk of this allocation.
            </p>
          </div>
        </div>
      )}

      {/* Performance Statistics */}
      <div className="bg-[#5b6a71] rounded-lg p-6 border border-[#6d9dbe]/20">
        <h3 className="text-xl font-bold text-white mb-4">Performance Statistics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Best Year */}
          <div className="bg-[#333333] rounded-lg p-4">
            <div className="text-green-400 text-sm mb-2">🎉 Best Year</div>
            <div className="text-white font-bold text-2xl mb-1">
              +{backtestData.statistics.bestYear.return.toFixed(1)}%
            </div>
            <div className="text-[#6d9dbe] text-sm">{backtestData.statistics.bestYear.year}</div>
          </div>

          {/* Worst Year */}
          <div className="bg-[#333333] rounded-lg p-4">
            <div className="text-red-400 text-sm mb-2">📉 Worst Year</div>
            <div className="text-white font-bold text-2xl mb-1">
              {backtestData.statistics.worstYear.return.toFixed(1)}%
            </div>
            <div className="text-[#6d9dbe] text-sm">{backtestData.statistics.worstYear.year}</div>
          </div>

          {/* Average Return */}
          <div className="bg-[#333333] rounded-lg p-4">
            <div className="text-[#1a7a82] text-sm mb-2">📊 Average Return</div>
            <div className="text-white font-bold text-2xl mb-1">
              {backtestData.statistics.averageReturn.toFixed(1)}%
            </div>
            <div className="text-[#6d9dbe] text-sm">Per Year</div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <div className="text-[#6d9dbe] text-sm mb-1">Volatility</div>
            <div className="text-white font-bold">{backtestData.statistics.volatility.toFixed(1)}%</div>
          </div>
          <div className="text-center">
            <div className="text-[#6d9dbe] text-sm mb-1">Positive Years</div>
            <div className="text-white font-bold">{backtestData.statistics.positiveYears}</div>
          </div>
          <div className="text-center">
            <div className="text-[#6d9dbe] text-sm mb-1">Negative Years</div>
            <div className="text-white font-bold">{backtestData.statistics.negativeYears}</div>
          </div>
          <div className="text-center">
            <div className="text-[#6d9dbe] text-sm mb-1">Win Rate</div>
            <div className="text-white font-bold">
              {((backtestData.statistics.positiveYears / (backtestData.statistics.positiveYears + backtestData.statistics.negativeYears)) * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
