/**
 * Narrative Reports - Client Reporting UI
 * 
 * Generate and manage quarterly, annual, and tax reports.
 */

import { useState, useEffect } from 'react';
import { FileText, Download, Send, Loader2, ArrowLeft, Calendar, PieChart, DollarSign } from 'lucide-react';
import axios from 'axios';

const API_URL = 'https://farther-prism-production.up.railway.app';

const REPORT_TYPES = [
  { id: 'quarterly', label: 'Quarterly Performance Review', icon: Calendar, description: 'Performance summary, allocation, top holdings, market commentary' },
  { id: 'annual', label: 'Annual Investment Review', icon: PieChart, description: 'Comprehensive annual review with risk metrics and goals progress' },
  { id: 'tax', label: 'Annual Tax Summary', icon: DollarSign, description: 'Realized gains/losses, dividend income, tax-loss harvesting activity' },
];

export default function NarrativeReports() {
  const [step, setStep] = useState('select'); // select, configure, preview
  const [householdId, setHouseholdId] = useState('');
  const [selectedType, setSelectedType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [reports, setReports] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    periodStart: '',
    periodEnd: '',
  });

  const loadReports = async () => {
    if (!householdId) return;
    try {
      const res = await axios.get(`${API_URL}/api/v1/narrative/household/${householdId}`);
      setReports(res.data.reports || []);
    } catch (e) {
      console.error('Failed to load reports:', e);
    }
  };

  useEffect(() => {
    if (householdId && step === 'select') loadReports();
  }, [householdId, step]);

  const createReport = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/v1/narrative`, {
        householdId,
        reportType: selectedType.id,
        title: formData.title || `${selectedType.label} - ${new Date().toLocaleDateString()}`,
        periodStart: formData.periodStart || null,
        periodEnd: formData.periodEnd || null,
      });
      setReport(res.data.report);
      setStep('preview');
    } catch (error) {
      console.error('Failed to create report:', error);
      alert('Failed to create report');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => (n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  // Household selector
  if (!householdId) {
    return (
      <div className="min-h-screen bg-[#333333] p-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-[#FCFDFC] mb-4">📖 Narrative</h1>
          <p className="text-[#FCFDFC] opacity-80 mb-8">Turn data into stories. Go Farther.</p>
          <div className="bg-[#5b6a71] rounded-lg p-8">
            <label className="block text-[#FCFDFC] font-medium mb-2">Enter Household ID</label>
            <input
              type="text"
              placeholder="UUID of household"
              className="w-full px-4 py-3 rounded-lg bg-[#333333] text-[#FCFDFC] border-2 border-[#1a7a82] mb-4"
              onKeyDown={(e) => { if (e.key === 'Enter') { setHouseholdId(e.target.value); setStep('select'); } }}
            />
            <button
              onClick={(e) => { const v = e.target.parentElement.querySelector('input').value; setHouseholdId(v); setStep('select'); }}
              className="px-6 py-3 bg-[#1a7a82] text-[#FCFDFC] rounded-lg hover:bg-[#1a7a82]/80 font-bold"
            >
              Open Reports
            </button>
          </div>
          <a href="/" className="inline-block mt-6 text-[#FCFDFC] opacity-60 hover:opacity-100">← Back to Dashboard</a>
        </div>
      </div>
    );
  }

  // Report type selection
  if (step === 'select') {
    return (
      <div className="min-h-screen bg-[#333333] p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <a href="/" className="text-[#FCFDFC] opacity-60 hover:opacity-100"><ArrowLeft className="w-5 h-5" /></a>
            <h1 className="text-3xl font-bold text-[#FCFDFC]">📖 Narrative</h1>
          </div>

          <h2 className="text-xl font-bold text-[#FCFDFC] mb-6">Create New Report</h2>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {REPORT_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => { setSelectedType(type); setStep('configure'); }}
                  className="bg-[#5b6a71] rounded-lg p-6 text-left hover:bg-[#5b6a71]/80 transition border-2 border-transparent hover:border-[#1a7a82]"
                >
                  <Icon className="w-8 h-8 text-[#1a7a82] mb-3" />
                  <h3 className="text-[#FCFDFC] font-bold mb-2">{type.label}</h3>
                  <p className="text-[#FCFDFC] opacity-60 text-sm">{type.description}</p>
                </button>
              );
            })}
          </div>

          {/* Existing Reports */}
          {reports.length > 0 && (
            <>
              <h2 className="text-xl font-bold text-[#FCFDFC] mb-4">Previous Reports</h2>
              {reports.map((r) => (
                <div key={r.id} className="bg-[#5b6a71] rounded-lg p-4 mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-[#FCFDFC] font-bold">{r.title}</p>
                    <p className="text-[#FCFDFC] opacity-60 text-sm">{r.report_type} • {new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setReport(r); setStep('preview'); }}
                      className="px-3 py-1 bg-[#1a7a82] text-[#FCFDFC] rounded text-sm"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    );
  }

  // Configure report
  if (step === 'configure') {
    return (
      <div className="min-h-screen bg-[#333333] p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setStep('select')} className="text-[#FCFDFC] opacity-60 hover:opacity-100"><ArrowLeft className="w-5 h-5" /></button>
            <h1 className="text-3xl font-bold text-[#FCFDFC]">{selectedType.label}</h1>
          </div>

          <div className="bg-[#5b6a71] rounded-lg p-8">
            <div className="mb-6">
              <label className="block text-[#FCFDFC] font-medium mb-2">Report Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder={`${selectedType.label} - ${new Date().toLocaleDateString()}`}
                className="w-full px-4 py-3 rounded-lg bg-[#333333] text-[#FCFDFC] border-2 border-[#1a7a82]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-[#FCFDFC] font-medium mb-2">Period Start</label>
                <input
                  type="date"
                  value={formData.periodStart}
                  onChange={(e) => setFormData(prev => ({ ...prev, periodStart: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-[#333333] text-[#FCFDFC] border-2 border-[#1a7a82]"
                />
              </div>
              <div>
                <label className="block text-[#FCFDFC] font-medium mb-2">Period End</label>
                <input
                  type="date"
                  value={formData.periodEnd}
                  onChange={(e) => setFormData(prev => ({ ...prev, periodEnd: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-[#333333] text-[#FCFDFC] border-2 border-[#1a7a82]"
                />
              </div>
            </div>

            <button
              onClick={createReport}
              disabled={loading}
              className="w-full px-6 py-4 bg-[#1a7a82] text-[#FCFDFC] rounded-lg hover:bg-[#1a7a82]/80 font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating Report...</> : <><FileText className="w-5 h-5" /> Generate Report</>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Preview report
  if (step === 'preview' && report) {
    const content = report.content || {};
    const es = content.executiveSummary || {};

    return (
      <div className="min-h-screen bg-[#333333] p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setStep('select')} className="text-[#FCFDFC] opacity-60 hover:opacity-100"><ArrowLeft className="w-5 h-5" /></button>
              <h1 className="text-3xl font-bold text-[#FCFDFC]">{report.title}</h1>
            </div>
            <div className="flex gap-2">
              <a
                href={`${API_URL}/api/v1/narrative/${report.id}/preview`}
                target="_blank"
                className="px-4 py-2 bg-[#1a7a82] text-[#FCFDFC] rounded-lg flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Preview PDF
              </a>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-[#5b6a71] rounded-lg p-6 text-center">
              <p className="text-[#FCFDFC] opacity-60 text-sm">Portfolio Value</p>
              <p className="text-2xl font-bold text-[#FCFDFC]">${fmt(es.totalValue)}</p>
            </div>
            <div className="bg-[#5b6a71] rounded-lg p-6 text-center">
              <p className="text-[#FCFDFC] opacity-60 text-sm">Total Gain/Loss</p>
              <p className={`text-2xl font-bold ${(es.totalGainLoss || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {(es.totalGainLoss || 0) >= 0 ? '+' : ''}${fmt(es.totalGainLoss)}
              </p>
            </div>
            <div className="bg-[#5b6a71] rounded-lg p-6 text-center">
              <p className="text-[#FCFDFC] opacity-60 text-sm">Accounts</p>
              <p className="text-2xl font-bold text-[#FCFDFC]">{es.accountCount || 0}</p>
            </div>
          </div>

          {/* Performance */}
          {content.performanceSummary?.topPerformers && (
            <div className="bg-[#5b6a71] rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-[#FCFDFC] mb-4">Top Performers</h2>
              {content.performanceSummary.topPerformers.map((p, i) => (
                <div key={i} className="flex justify-between py-2 border-b border-[#333333] last:border-0">
                  <span className="text-[#FCFDFC] font-bold">{p.symbol}</span>
                  <span className={`font-bold ${p.returnPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {((p.returnPct || 0) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Market Commentary */}
          {content.marketCommentary && (
            <div className="bg-[#5b6a71] rounded-lg p-6">
              <h2 className="text-xl font-bold text-[#FCFDFC] mb-4">{content.marketCommentary.headline}</h2>
              <p className="text-[#FCFDFC] opacity-80 mb-4">{content.marketCommentary.body}</p>
              <h3 className="text-lg font-bold text-[#FCFDFC] mb-2">Outlook</h3>
              <p className="text-[#FCFDFC] opacity-80">{content.marketCommentary.outlook}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
