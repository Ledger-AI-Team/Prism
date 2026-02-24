/**
 * Farther Prism - Dashboard
 * 
 * Premium hero image + glass CTA + tool cards
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedHousehold, setSelectedHousehold] = useState(null);

  const tools = [
    {
      id: 'planning',
      name: 'Financial Planning',
      description: 'Institutional-grade planning engine with Monte Carlo projections',
      icon: '📊',
      route: '/planning',
      status: 'active',
      features: [
        'Monthly cash flow projections',
        'Tax-optimized withdrawals',
        'RMD & Roth conversion analysis',
        'Monte Carlo simulation (10K paths)',
        'IRMAA & NIIT modeling',
      ],
    },
    {
      id: 'portfolio',
      name: 'Portfolio Analysis',
      description: 'Performance attribution, rebalancing, and tax-loss harvesting',
      icon: '📈',
      route: '/portfolio',
      status: 'coming_soon',
      features: [
        'Performance attribution',
        'Asset allocation analysis',
        'Tax-loss harvesting opportunities',
        'Rebalancing recommendations',
        'Fee analysis & benchmarking',
      ],
    },
    {
      id: 'risk',
      name: 'Risk Assessment',
      description: 'AI-powered adaptive questionnaire with dual-dimension scoring',
      icon: '⚖️',
      route: '/risk',
      status: 'active',
      features: [
        'Behavioral risk tolerance (Prospect Theory)',
        'Financial risk capacity (Arrow-Pratt)',
        'Behavioral Investor Type classification',
        'Recommended allocation',
        'Compliance audit trail',
      ],
    },
    {
      id: 'proposals',
      name: 'Client Proposals',
      description: 'Branded pitch decks, fee calculators, and engagement letters',
      icon: '📄',
      route: '/proposals',
      status: 'coming_soon',
      features: [
        'Branded proposal templates',
        'Fee calculator & comparison',
        'Service tier breakdown',
        'E-signature integration',
        'CRM sync',
      ],
    },
    {
      id: 'reports',
      name: 'Client Reporting',
      description: 'Performance reports, tax summaries, and compliance exports',
      icon: '📋',
      route: '/reports',
      status: 'coming_soon',
      features: [
        'Quarterly performance reports',
        'Tax gain/loss summaries',
        'Realized gains reports',
        'Compliance-ready exports',
        'White-label branding',
      ],
    },
    {
      id: 'scenarios',
      name: 'What-If Scenarios',
      description: 'Model life events: retirement, home purchase, education funding',
      icon: '🔮',
      route: '/scenarios',
      status: 'coming_soon',
      features: [
        'Early retirement modeling',
        'Home purchase impact',
        'Education funding strategies',
        'Divorce/inheritance scenarios',
        'Business sale planning',
      ],
    },
  ];

  const handleToolClick = (tool) => {
    console.log('[Dashboard] Tool clicked:', tool.name, tool.route, tool.status);
    if (tool.status === 'active') {
      console.log('[Dashboard] Navigating to:', tool.route);
      navigate(tool.route);
    } else {
      console.log('[Dashboard] Tool not active, ignoring click');
    }
  };

  const handleBeginPlanning = () => {
    navigate('/planning');
  };

  return (
    <div className="min-h-screen bg-[#333333]">
      {/* Hero Section with Image + Glass Button */}
      <div className="relative w-full h-[70vh] min-h-[600px] overflow-hidden">
        {/* Hero Image Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(/prism-hero.jpg)',
            backgroundPosition: 'center',
            backgroundSize: 'cover',
          }}
        />
        
        {/* Subtle overlay for button contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/30" />
        
        {/* Glass CTA Button */}
        <div className="relative z-10 flex items-center justify-center h-full">
          <button
            onClick={handleBeginPlanning}
            className="group relative px-12 py-6 text-2xl font-light tracking-wide text-white transition-all duration-300 hover:scale-105"
          >
            {/* Glass background */}
            <div className="absolute inset-0 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl transition-all duration-300 group-hover:bg-white/20 group-hover:border-white/30" />
            
            {/* Shine effect on hover */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine" />
            </div>
            
            {/* Button text */}
            <span className="relative z-10">Begin Planning</span>
          </button>
        </div>
      </div>

      {/* Tools Grid Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Intelligent Wealth Platforms
          </h2>
          <p className="text-[#6d9dbe] text-lg max-w-2xl mx-auto">
            Institutional-grade tools that work together seamlessly. All powered by the same household data.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <div
              key={tool.id}
              onClick={() => handleToolClick(tool)}
              className={`
                bg-[#5b6a71] rounded-lg p-6 border border-[#6d9dbe]/20
                transition-all duration-200
                ${tool.status === 'active' 
                  ? 'cursor-pointer hover:border-[#1a7a82] hover:shadow-lg hover:scale-105' 
                  : 'opacity-60 cursor-not-allowed'
                }
              `}
            >
              {/* Tool Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="text-4xl">{tool.icon}</div>
                <div>
                  {tool.status === 'active' ? (
                    <span className="px-2 py-1 bg-[#1a7a82] text-white text-xs rounded">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-[#333333] text-[#6d9dbe] text-xs rounded">
                      Coming Soon
                    </span>
                  )}
                </div>
              </div>

              {/* Tool Info */}
              <h3 className="text-xl font-bold text-white mb-2">
                {tool.name}
              </h3>
              <p className="text-[#ffffff] opacity-80 text-sm mb-4">
                {tool.description}
              </p>

              {/* Features List */}
              <ul className="space-y-2">
                {tool.features.slice(0, 3).map((feature, idx) => (
                  <li key={idx} className="flex items-start text-sm text-[#6d9dbe]">
                    <span className="mr-2">•</span>
                    <span>{feature}</span>
                  </li>
                ))}
                {tool.features.length > 3 && (
                  <li className="text-sm text-[#6d9dbe] opacity-60">
                    +{tool.features.length - 3} more
                  </li>
                )}
              </ul>

              {/* Action Button */}
              {tool.status === 'active' && (
                <div className="mt-6">
                  <button className="w-full px-4 py-2 bg-[#1a7a82] text-white rounded hover:bg-[#1a7a82]/80 transition font-medium">
                    Open Tool →
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#333333] border-t border-[#5b6a71] mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/farther-symbol.png" 
                alt="Farther" 
                className="h-6 w-auto opacity-60"
              />
              <div className="text-[#6d9dbe] text-sm">
                © 2026 Farther, Inc. All rights reserved.
              </div>
            </div>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-[#6d9dbe] hover:text-white transition">Documentation</a>
              <a href="#" className="text-[#6d9dbe] hover:text-white transition">API</a>
              <a href="#" className="text-[#6d9dbe] hover:text-white transition">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
