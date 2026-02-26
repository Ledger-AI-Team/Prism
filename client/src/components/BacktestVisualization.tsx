/**
 * Backtest Visualization Component
 * 
 * Interactive backtesting visualization for portfolio allocations.
 * Features:
 * - Historical performance chart ($100K from 1999 to present)
 * - Interactive slider to adjust allocation ±10%
 * - Performance statistics (best/worst/average annual returns)
 */

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Allocation {
  stocks: number;
  bonds: number;
  alternatives: number;
  cash: number;
}

interface BacktestResult {
  allocation: Allocation;
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
}

interface Props {
  baseAllocation: Allocation;
}

export default function BacktestVisualization({ baseAllocation }: Props) {
  const [adjustment, setAdjustment] = useState(0); // -10, 0, +10
  const [backtestData, setBacktestData] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate adjusted allocation based on slider
  const getAdjustedAllocation = (adj: number): Allocation => {
    // Adjust stocks by slider value, compensate with bonds
    const stocksAdj = Math.max(0, Math.min(100, baseAllocation.stocks + adj));
    const bondsAdj = Math.max(0, Math.min(100, baseAllocation.bonds - adj));
    
    return {
      stocks: stocksAdj,
      bonds: bondsAdj,
      alternatives: baseAllocation.alternatives,
      cash: baseAllocation.cash,
    };
  };

  // Fetch backtest data
  const runBacktest = async (allocation: Allocation) => {
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
          rebalanceFrequency: 'monthly',
        }),
      });

      if (!response.ok) {
        throw new Error(`Backtest failed: ${response.statusText}`);
      }

      const data = await response.json();
      setBacktestData(data);
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
  }, [adjustment, baseAllocation]);

  if (loading && !backtestData) {
    return (
      <div className="bg-[#5b6a71] rounded-lg p-6 border border-[#6d9dbe]/20">
        <div className="text-center text-white py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a7a82] mx-auto mb-4"></div>
          <p>Running historical backtest...</p>
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

  // Format chart data (sample every N points for performance)
  const chartData = backtestData.portfolioValues
    .filter((_, idx) => idx % 20 === 0) // Sample every 20th point
    .map(d => ({
      date: new Date(d.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
      value: d.value,
    }));

  return (
    <div className="space-y-6">
      {/* Historical Performance Chart */}
      <div className="bg-[#5b6a71] rounded-lg p-6 border border-[#6d9dbe]/20">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-white mb-2">
            Historical Performance (1999-Present)
          </h3>
          <p className="text-[#6d9dbe] text-sm">
            Growth of $100,000 invested on January 1, 1999
          </p>
        </div>

        {/* Allocation Slider */}
        <div className="mb-6 p-4 bg-[#333333] rounded-lg">
          <div className="mb-3">
            <label className="text-white font-medium mb-2 block">
              Adjust Stock/Bond Allocation
            </label>
            <div className="flex items-center space-x-4">
              <span className="text-[#6d9dbe] text-sm w-20">-10%</span>
              <input
                type="range"
                min="-10"
                max="10"
                step="10"
                value={adjustment}
                onChange={(e) => setAdjustment(parseInt(e.target.value))}
                className="flex-1 h-2 bg-[#5b6a71] rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #6d9dbe 0%, #1a7a82 50%, #6d9dbe 100%)`,
                }}
              />
              <span className="text-[#6d9dbe] text-sm w-20 text-right">+10%</span>
            </div>
          </div>

          {/* Current Allocation Display */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            <div className="text-center">
              <div className="text-white font-bold text-lg">{currentAllocation.stocks}%</div>
              <div className="text-[#6d9dbe] text-xs">Stocks</div>
            </div>
            <div className="text-center">
              <div className="text-white font-bold text-lg">{currentAllocation.bonds}%</div>
              <div className="text-[#6d9dbe] text-xs">Bonds</div>
            </div>
            <div className="text-center">
              <div className="text-white font-bold text-lg">{currentAllocation.alternatives}%</div>
              <div className="text-[#6d9dbe] text-xs">Alternatives</div>
            </div>
            <div className="text-center">
              <div className="text-white font-bold text-lg">{currentAllocation.cash}%</div>
              <div className="text-[#6d9dbe] text-xs">Cash</div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#6d9dbe20" />
            <XAxis
              dataKey="date"
              stroke="#6d9dbe"
              tick={{ fill: '#6d9dbe', fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#6d9dbe"
              tick={{ fill: '#6d9dbe', fontSize: 12 }}
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
            <Line
              type="monotone"
              dataKey="value"
              stroke="#1a7a82"
              strokeWidth={2}
              dot={false}
              name="Portfolio Value"
            />
          </LineChart>
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
