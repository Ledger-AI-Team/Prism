/**
 * Proposify Builder Component
 * 
 * Create and customize client proposals with fee calculator and value ROI.
 */

import { useState, useEffect } from 'react';
import { DollarSign, FileText, Send, Download, Loader2, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = 'https://farther-prism-production.up.railway.app';

export default function ProposifyBuilder() {
  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [proposal, setProposal] = useState(null);

  const [formData, setFormData] = useState({
    templateId: '',
    clientName: '',
    clientEmail: '',
    portfolioSize: '',
    feeType: 'aum',
    feePercentage: 0.01, // 1.0%
    feeFlat: 0,
    taxAlphaPercentage: 0.02, // 2.0%
  });

  const [calculations, setCalculations] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (formData.portfolioSize) {
      calculateValue();
    }
  }, [formData.portfolioSize, formData.feeType, formData.feePercentage, formData.feeFlat, formData.taxAlphaPercentage]);

  const loadTemplates = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/proposify/templates/list`);
      setTemplates(response.data.templates);
      if (response.data.templates.length > 0) {
        setFormData(prev => ({ ...prev, templateId: response.data.templates[0].id }));
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const calculateValue = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/v1/proposify/temp/calculate`, {
        portfolioSize: parseFloat(formData.portfolioSize),
        feeType: formData.feeType,
        feePercentage: parseFloat(formData.feePercentage),
        feeFlat: parseFloat(formData.feeFlat),
        taxAlphaPercentage: parseFloat(formData.taxAlphaPercentage),
      });

      setCalculations(response.data.calculations);
    } catch (error) {
      console.error('Calculation failed:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const createProposal = async () => {
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/v1/proposify`, {
        ...formData,
        portfolioSize: parseFloat(formData.portfolioSize),
        feePercentage: parseFloat(formData.feePercentage),
        feeFlat: parseFloat(formData.feeFlat),
        taxAlphaPercentage: parseFloat(formData.taxAlphaPercentage),
      });

      setProposal(response.data.proposal);
      setStep(2);
    } catch (error) {
      console.error('Failed to create proposal:', error);
      alert('Failed to create proposal');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    setPdfGenerating(true);

    try {
      const response = await axios.post(`${API_URL}/api/v1/proposify/${proposal.id}/pdf`);
      
      setProposal(prev => ({ ...prev, pdf_url: response.data.pdfUrl }));
      alert('PDF generated successfully!');
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('PDF generation failed');
    } finally {
      setPdfGenerating(false);
    }
  };

  const sendProposal = async () => {
    try {
      await axios.post(`${API_URL}/api/v1/proposify/${proposal.id}/send`);
      setProposal(prev => ({ ...prev, status: 'sent' }));
      alert(`Proposal sent to ${proposal.client_email}`);
    } catch (error) {
      console.error('Failed to send proposal:', error);
      alert('Failed to send proposal');
    }
  };

  // Step 1: Proposal Builder Form
  if (step === 1) {
    return (
      <div className="min-h-screen bg-[#333333] p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-[#FCFDFC] mb-4">Create Proposal</h1>
            <p className="text-[#FCFDFC] opacity-80">Craft compelling proposals. Go Farther.</p>
          </div>

          {/* Form Card */}
          <div className="bg-[#5b6a71] rounded-lg p-8 shadow-xl">
            {/* Template Selection */}
            <div className="mb-6">
              <label className="block text-[#FCFDFC] font-medium mb-2">Proposal Template</label>
              <select
                value={formData.templateId}
                onChange={(e) => handleInputChange('templateId', e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#333333] text-[#FCFDFC] border-2 border-[#1a7a82] focus:outline-none focus:border-[#1a7a82]/80"
              >
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name} - {template.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Client Info */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-[#FCFDFC] font-medium mb-2">Client Name</label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => handleInputChange('clientName', e.target.value)}
                  placeholder="John Smith"
                  className="w-full px-4 py-3 rounded-lg bg-[#333333] text-[#FCFDFC] border-2 border-[#1a7a82] focus:outline-none focus:border-[#1a7a82]/80"
                />
              </div>
              <div>
                <label className="block text-[#FCFDFC] font-medium mb-2">Client Email</label>
                <input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 rounded-lg bg-[#333333] text-[#FCFDFC] border-2 border-[#1a7a82] focus:outline-none focus:border-[#1a7a82]/80"
                />
              </div>
            </div>

            {/* Portfolio Size */}
            <div className="mb-6">
              <label className="block text-[#FCFDFC] font-medium mb-2">Portfolio Size</label>
              <input
                type="number"
                value={formData.portfolioSize}
                onChange={(e) => handleInputChange('portfolioSize', e.target.value)}
                placeholder="2000000"
                className="w-full px-4 py-3 rounded-lg bg-[#333333] text-[#FCFDFC] border-2 border-[#1a7a82] focus:outline-none focus:border-[#1a7a82]/80"
              />
            </div>

            {/* Fee Structure */}
            <div className="mb-6">
              <label className="block text-[#FCFDFC] font-medium mb-2">Fee Structure</label>
              <select
                value={formData.feeType}
                onChange={(e) => handleInputChange('feeType', e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#333333] text-[#FCFDFC] border-2 border-[#1a7a82] focus:outline-none focus:border-[#1a7a82]/80 mb-4"
              >
                <option value="aum">AUM-Based (%)</option>
                <option value="flat">Flat Fee ($)</option>
                <option value="hybrid">Hybrid (% + $)</option>
              </select>

              {(formData.feeType === 'aum' || formData.feeType === 'hybrid') && (
                <div className="mb-4">
                  <label className="block text-[#FCFDFC] font-medium mb-2">AUM Fee (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.feePercentage * 100}
                    onChange={(e) => handleInputChange('feePercentage', parseFloat(e.target.value) / 100)}
                    placeholder="1.00"
                    className="w-full px-4 py-3 rounded-lg bg-[#333333] text-[#FCFDFC] border-2 border-[#1a7a82] focus:outline-none focus:border-[#1a7a82]/80"
                  />
                </div>
              )}

              {(formData.feeType === 'flat' || formData.feeType === 'hybrid') && (
                <div>
                  <label className="block text-[#FCFDFC] font-medium mb-2">Flat Fee ($)</label>
                  <input
                    type="number"
                    value={formData.feeFlat}
                    onChange={(e) => handleInputChange('feeFlat', e.target.value)}
                    placeholder="5000"
                    className="w-full px-4 py-3 rounded-lg bg-[#333333] text-[#FCFDFC] border-2 border-[#1a7a82] focus:outline-none focus:border-[#1a7a82]/80"
                  />
                </div>
              )}
            </div>

            {/* Tax Alpha */}
            <div className="mb-8">
              <label className="block text-[#FCFDFC] font-medium mb-2">Tax Alpha Estimate (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.taxAlphaPercentage * 100}
                onChange={(e) => handleInputChange('taxAlphaPercentage', parseFloat(e.target.value) / 100)}
                placeholder="2.0"
                className="w-full px-4 py-3 rounded-lg bg-[#333333] text-[#FCFDFC] border-2 border-[#1a7a82] focus:outline-none focus:border-[#1a7a82]/80"
              />
              <p className="text-[#FCFDFC] opacity-60 text-sm mt-2">Farther typically delivers 1-3% annual tax alpha</p>
            </div>

            {/* Value Calculation Preview */}
            {calculations && (
              <div className="bg-[#333333] rounded-lg p-6 mb-8 border-2 border-[#1a7a82]">
                <h3 className="text-xl font-bold text-[#FCFDFC] mb-4">Value Calculation</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-[#FCFDFC]">
                    <span>Annual Fee:</span>
                    <span className="font-bold">${calculations.feeAnnual.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between text-[#FCFDFC]">
                    <span>Tax Alpha:</span>
                    <span className="font-bold text-[#1a7a82]">+${calculations.taxAlphaAnnual.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between text-[#FCFDFC] pt-3 border-t border-[#5b6a71]">
                    <span className="font-bold">Net Value:</span>
                    <span className="font-bold text-[#1a7a82]">${calculations.netValueAnnual.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/year</span>
                  </div>
                  <div className="flex justify-between text-[#FCFDFC]">
                    <span className="font-bold">ROI:</span>
                    <span className="font-bold text-2xl text-[#1a7a82]">{calculations.roiPercentage.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Create Button */}
            <button
              onClick={createProposal}
              disabled={loading || !formData.clientName || !formData.portfolioSize}
              className="w-full px-6 py-4 bg-[#1a7a82] text-[#FCFDFC] rounded-lg hover:bg-[#1a7a82]/80 transition font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Proposal...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Create Proposal
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Proposal Preview & Actions
  if (step === 2) {
    return (
      <div className="min-h-screen bg-[#333333] p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <CheckCircle className="w-16 h-16 text-[#1a7a82] mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-[#FCFDFC] mb-4">Proposal Created!</h1>
            <p className="text-[#FCFDFC] opacity-80">For {proposal.client_name}</p>
          </div>

          {/* Summary Card */}
          <div className="bg-[#5b6a71] rounded-lg p-8 shadow-xl mb-6">
            <h2 className="text-2xl font-bold text-[#FCFDFC] mb-6">Proposal Summary</h2>

            <div className="space-y-4">
              <div className="flex justify-between text-[#FCFDFC]">
                <span>Portfolio Size:</span>
                <span className="font-bold">${parseFloat(proposal.portfolio_size).toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between text-[#FCFDFC]">
                <span>Annual Fee:</span>
                <span className="font-bold">${parseFloat(proposal.fee_annual).toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between text-[#FCFDFC]">
                <span>Tax Alpha:</span>
                <span className="font-bold text-[#1a7a82]">+${parseFloat(proposal.tax_alpha_annual).toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between text-[#FCFDFC] pt-4 border-t border-[#333333]">
                <span className="text-xl font-bold">Net Value:</span>
                <span className="text-xl font-bold text-[#1a7a82]">${parseFloat(proposal.net_value_annual).toLocaleString('en-US', { minimumFractionDigits: 0 })}/year</span>
              </div>
              <div className="flex justify-between text-[#FCFDFC]">
                <span className="text-xl font-bold">ROI:</span>
                <span className="text-3xl font-bold text-[#1a7a82]">{parseFloat(proposal.roi_percentage).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={generatePDF}
              disabled={pdfGenerating}
              className="px-6 py-4 bg-[#1a7a82] text-[#FCFDFC] rounded-lg hover:bg-[#1a7a82]/80 transition font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {pdfGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Generate PDF
                </>
              )}
            </button>

            <button
              onClick={sendProposal}
              disabled={!proposal.pdf_url}
              className="px-6 py-4 bg-[#1a7a82] text-[#FCFDFC] rounded-lg hover:bg-[#1a7a82]/80 transition font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
              Send to Client
            </button>
          </div>

          {proposal.pdf_url && (
            <div className="mt-4 text-center">
              <a
                href={proposal.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1a7a82] hover:underline"
              >
                View PDF →
              </a>
            </div>
          )}

          {/* Back Button */}
          <div className="mt-8 text-center">
            <button
              onClick={() => setStep(1)}
              className="text-[#FCFDFC] opacity-80 hover:opacity-100 transition"
            >
              ← Create Another Proposal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
