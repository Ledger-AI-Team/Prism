/**
 * Risk Profile Results Dashboard
 * 
 * Displays:
 * - Total risk score and classification
 * - Behavioral Investor Type (BIT)
 * - Recommended allocation
 * - Capacity vs Willingness breakdown
 * - Compliance audit trail
 */

import React from 'react';
import { BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { AssessmentResult } from '../types/risk';
import BacktestVisualization from './BacktestVisualization';

interface Props {
  result: AssessmentResult;
  onRestart: () => void;
  onClose: () => void;
}

export default function RiskResults({ result, onRestart, onClose }: Props) {
  const { totalScore, riskCapacity, riskWillingness, behavioralType, recommendedTier } = result;

  // Allocation chart data
  const allocationData = [
    { name: 'Stocks', value: recommendedTier.allocation.stocks, color: '#1a7a82' },
    { name: 'Bonds', value: recommendedTier.allocation.bonds, color: '#6d9dbe' },
    { name: 'Alternatives', value: recommendedTier.allocation.alternatives, color: '#5b6a71' },
    { name: 'Cash', value: recommendedTier.allocation.cash, color: '#ffffff' },
  ];

  // Capacity vs Willingness
  const capacityWillingnessData = [
    { metric: 'Capacity', score: riskCapacity },
    { metric: 'Willingness', score: riskWillingness },
  ];

  // BIT visualization
  const bitScale = [
    { label: 'Highly\nEmotional', value: 1.5, current: behavioralType.category === 'highly-emotional' },
    { label: 'Emotional', value: 4.5, current: behavioralType.category === 'emotional' },
    { label: 'Emotional-\nBlend', value: 7.5, current: behavioralType.category === 'emotional-blend' },
    { label: 'Cognitive', value: 10.5, current: behavioralType.category === 'cognitive' },
    { label: 'Hyper-\nCognitive', value: 13.5, current: behavioralType.category === 'hyper-cognitive' },
  ];

  return (
    <div className="min-h-screen bg-[#333333] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Risk Profile Assessment Results
              </h1>
              <p className="text-[#6d9dbe]">
                Completed {new Date(result.timestamp).toLocaleDateString()}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onRestart}
                className="px-6 py-3 bg-[#5b6a71] text-white rounded-lg hover:bg-[#6d9dbe] transition"
              >
                Retake Assessment
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-[#1a7a82] text-white rounded-lg hover:bg-[#1a7a82]/80 transition"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Score */}
          <div className="bg-[#5b6a71] rounded-lg p-6 border border-[#6d9dbe]/20">
            <div className="text-[#6d9dbe] text-sm mb-2">Total Risk Score</div>
            <div className="text-4xl font-bold text-white mb-1">{totalScore}</div>
            <div className="text-[#ffffff] opacity-80 text-sm">
              out of {result.questionHistory.length * 15}
            </div>
          </div>

          {/* Risk Tier */}
          <div className="bg-[#5b6a71] rounded-lg p-6 border border-[#6d9dbe]/20">
            <div className="text-[#6d9dbe] text-sm mb-2">Recommended Tier</div>
            <div className="text-4xl font-bold text-white mb-1">
              {recommendedTier.level}/10
            </div>
            <div className="text-[#ffffff] opacity-80 text-sm">
              {recommendedTier.name}
            </div>
          </div>

          {/* BIT Category */}
          <div className="bg-[#5b6a71] rounded-lg p-6 border border-[#6d9dbe]/20">
            <div className="text-[#6d9dbe] text-sm mb-2">Behavioral Type</div>
            <div className="text-2xl font-bold text-white mb-1 capitalize">
              {behavioralType.category.replace('-', ' ')}
            </div>
            <div className="text-[#ffffff] opacity-80 text-sm">
              Score: {behavioralType.score.toFixed(1)}/15
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recommended Allocation */}
          <div className="bg-[#5b6a71] rounded-lg p-6 border border-[#6d9dbe]/20">
            <h3 className="text-xl font-bold text-white mb-4">Recommended Allocation</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {allocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <p className="text-[#ffffff] opacity-80 text-sm mt-4">
              {recommendedTier.description}
            </p>
          </div>

          {/* Capacity vs Willingness */}
          <div className="bg-[#5b6a71] rounded-lg p-6 border border-[#6d9dbe]/20">
            <h3 className="text-xl font-bold text-white mb-4">
              Risk Capacity vs Willingness
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={capacityWillingnessData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#6d9dbe20" />
                <XAxis dataKey="metric" stroke="#6d9dbe" />
                <YAxis stroke="#6d9dbe" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#333333',
                    border: '1px solid #6d9dbe',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="score" fill="#1a7a82" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2 text-sm text-[#ffffff] opacity-80">
              <p>
                <strong>Capacity ({riskCapacity}):</strong> Financial ability to take risk
              </p>
              <p>
                <strong>Willingness ({riskWillingness}):</strong> Emotional comfort with risk
              </p>
            </div>
          </div>
        </div>

        {/* Historical Backtest */}
        <div className="mb-8">
          <BacktestVisualization baseAllocation={recommendedTier.allocation} />
        </div>

        {/* Behavioral Investor Type (BIT) */}
        <div className="bg-[#5b6a71] rounded-lg p-6 border border-[#6d9dbe]/20 mb-8">
          <h3 className="text-xl font-bold text-white mb-4">
            Behavioral Investor Type (BIT)
          </h3>
          
          <div className="mb-6">
            <p className="text-[#ffffff] opacity-90 mb-4">
              {behavioralType.description}
            </p>
            
            {/* BIT Scale Visualization */}
            <div className="relative h-16 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-lg mb-6">
              <div
                className="absolute top-0 w-4 h-full bg-white border-2 border-[#333333] rounded"
                style={{
                  left: `${(behavioralType.score / 15) * 100}%`,
                  transform: 'translateX(-50%)',
                }}
              />
              <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 -mb-6">
                {bitScale.map((item, idx) => (
                  <div
                    key={idx}
                    className={`text-xs text-center ${
                      item.current ? 'text-white font-bold' : 'text-[#6d9dbe]'
                    }`}
                  >
                    {item.label.split('\n').map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {/* Traits */}
            <div>
              <h4 className="text-lg font-bold text-white mb-3">Characteristics</h4>
              <ul className="space-y-2">
                {behavioralType.traits.map((trait, idx) => (
                  <li key={idx} className="flex items-start text-[#ffffff] opacity-80">
                    <span className="text-[#1a7a82] mr-2">•</span>
                    <span>{trait}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div>
              <h4 className="text-lg font-bold text-white mb-3">Recommendations</h4>
              <ul className="space-y-2">
                {behavioralType.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start text-[#ffffff] opacity-80">
                    <span className="text-[#1a7a82] mr-2">✓</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Compliance Trail */}
        <div className="bg-[#5b6a71] rounded-lg p-6 border border-[#6d9dbe]/20">
          <h3 className="text-xl font-bold text-white mb-4">
            Compliance Documentation
          </h3>
          
          <div className="space-y-4">
            <div>
              <div className="text-[#6d9dbe] text-sm mb-1">Assessment ID</div>
              <div className="text-white font-mono">{result.complianceLog.assessmentId}</div>
            </div>

            <div>
              <div className="text-[#6d9dbe] text-sm mb-1">Methodology</div>
              <div className="text-white">{result.complianceLog.methodology}</div>
            </div>

            <div>
              <div className="text-[#6d9dbe] text-sm mb-1">Disclosures</div>
              <ul className="space-y-2 mt-2">
                {result.complianceLog.disclosures.map((disclosure, idx) => (
                  <li key={idx} className="text-[#ffffff] opacity-80 text-sm flex items-start">
                    <span className="mr-2">•</span>
                    <span>{disclosure}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-[#6d9dbe] text-sm mb-2">Question Audit Trail</div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {result.questionHistory.map((item, idx) => (
                  <details key={idx} className="bg-[#333333] rounded p-3">
                    <summary className="text-white cursor-pointer">
                      Q{idx + 1}: {item.question.section} (Score: {item.answer.score}/15)
                    </summary>
                    <div className="mt-2 text-[#ffffff] opacity-80 text-sm space-y-1">
                      <p><strong>Question:</strong> {item.question.text}</p>
                      <p><strong>Answer:</strong> {
                        item.question.options.find(o => o.id === item.answer.optionId)?.text
                      }</p>
                      {item.question.rationale && (
                        <p><strong>Rationale:</strong> {item.question.rationale}</p>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
