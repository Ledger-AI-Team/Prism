/**
 * AI Slide Renderer
 * 
 * Professional slide templates for AI-generated presentations.
 * Supports 8+ layout types with Farther branding.
 */

import { TrendingUp, TrendingDown, Target, CheckCircle, AlertTriangle, DollarSign, Calendar, BarChart3, Workflow, Quote as QuoteIcon } from 'lucide-react';

const ICONS = {
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  'target': Target,
  'check-circle': CheckCircle,
  'alert-triangle': AlertTriangle,
  'dollar-sign': DollarSign,
  'calendar': Calendar,
  'bar-chart': BarChart3,
  'workflow': Workflow,
  'quote': QuoteIcon,
  'list': BarChart3,
  'table': BarChart3,
  'columns': BarChart3,
  'layout-grid': BarChart3,
  'presentation': Target,
  'image': Target,
};

export default function AISlideRenderer({ slide, branding }) {
  const colors = branding || {
    primary: '#1a7a82',
    secondary: '#2d9da6',
    accent: '#40c0ca',
    text: '#FCFDFC',
    background: '#333333',
    cardBg: '#5b6a71',
  };

  const Icon = ICONS[slide.visualSuggestion] || Target;

  // Title Slide (Hero, Centered)
  if (slide.type === 'title') {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-16">
        {slide.icon !== false && <Icon className="w-20 h-20 mb-8" style={{ color: colors.primary }} />}
        <h1 className="text-6xl font-bold mb-6" style={{ color: colors.text }}>
          {slide.title}
        </h1>
        {slide.subtitle && (
          <p className="text-3xl font-light" style={{ color: colors.accent }}>
            {slide.subtitle}
          </p>
        )}
        {slide.clientName && (
          <p className="text-xl mt-8 opacity-60" style={{ color: colors.text }}>
            Prepared for {slide.clientName}
          </p>
        )}
      </div>
    );
  }

  // Content Slide (Bullets)
  if (slide.type === 'content') {
    return (
      <div className="h-full flex flex-col p-12">
        <div className="mb-8">
          <h2 className="text-4xl font-bold" style={{ color: colors.text }}>
            {slide.title}
          </h2>
          {slide.subtitle && (
            <p className="text-xl mt-2 opacity-70" style={{ color: colors.text }}>
              {slide.subtitle}
            </p>
          )}
        </div>
        
        <div className="flex-1 flex items-center">
          <ul className="space-y-6 w-full">
            {(slide.bullets || []).map((bullet, i) => (
              <li key={i} className="flex items-start gap-4 text-2xl" style={{ color: colors.text }}>
                <div 
                  className="w-3 h-3 rounded-full mt-3 flex-shrink-0" 
                  style={{ backgroundColor: colors.primary }}
                />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // Two Column Layout
  if (slide.type === 'two_column') {
    return (
      <div className="h-full flex flex-col p-12">
        <h2 className="text-4xl font-bold mb-8" style={{ color: colors.text }}>
          {slide.title}
        </h2>
        
        <div className="flex-1 grid grid-cols-2 gap-8">
          {(slide.columns || []).map((col, i) => (
            <div key={i} className="flex flex-col">
              {col.title && (
                <h3 className="text-2xl font-bold mb-4" style={{ color: colors.accent }}>
                  {col.title}
                </h3>
              )}
              {col.content && (
                <p className="text-lg mb-4 opacity-90" style={{ color: colors.text }}>
                  {col.content}
                </p>
              )}
              {col.bullets && (
                <ul className="space-y-3">
                  {col.bullets.map((bullet, j) => (
                    <li key={j} className="flex items-start gap-3 text-lg" style={{ color: colors.text }}>
                      <CheckCircle className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: colors.primary }} />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Three Column Layout
  if (slide.type === 'three_column') {
    return (
      <div className="h-full flex flex-col p-12">
        <h2 className="text-4xl font-bold mb-8" style={{ color: colors.text }}>
          {slide.title}
        </h2>
        
        <div className="flex-1 grid grid-cols-3 gap-6">
          {(slide.columns || []).map((col, i) => (
            <div 
              key={i} 
              className="rounded-lg p-6 flex flex-col"
              style={{ backgroundColor: colors.cardBg }}
            >
              {col.icon && (
                <div className="mb-4">
                  <Icon className="w-10 h-10" style={{ color: colors.primary }} />
                </div>
              )}
              {col.title && (
                <h3 className="text-xl font-bold mb-3" style={{ color: colors.text }}>
                  {col.title}
                </h3>
              )}
              {col.content && (
                <p className="text-base opacity-80 flex-1" style={{ color: colors.text }}>
                  {col.content}
                </p>
              )}
              {col.bullets && (
                <ul className="space-y-2 text-sm">
                  {col.bullets.map((bullet, j) => (
                    <li key={j} className="flex items-start gap-2" style={{ color: colors.text }}>
                      <span className="opacity-50">•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Data Table
  if (slide.type === 'data_table' && slide.data) {
    return (
      <div className="h-full flex flex-col p-12">
        <h2 className="text-4xl font-bold mb-8" style={{ color: colors.text }}>
          {slide.title}
        </h2>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-5xl">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ backgroundColor: colors.primary }}>
                  {(slide.data.headers || []).map((header, i) => (
                    <th 
                      key={i} 
                      className="text-left px-6 py-4 font-bold text-lg"
                      style={{ color: colors.text }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(slide.data.rows || []).map((row, i) => (
                  <tr 
                    key={i}
                    className={i % 2 === 0 ? '' : 'bg-opacity-30'}
                    style={{ 
                      backgroundColor: i % 2 === 0 ? 'transparent' : colors.cardBg,
                      borderBottom: `1px solid ${colors.cardBg}`
                    }}
                  >
                    {row.map((cell, j) => (
                      <td 
                        key={j} 
                        className="px-6 py-4 text-lg"
                        style={{ color: colors.text }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Metrics Display (Big Numbers)
  if (slide.type === 'metrics' && slide.metrics) {
    return (
      <div className="h-full flex flex-col p-12">
        <h2 className="text-4xl font-bold mb-12" style={{ color: colors.text }}>
          {slide.title}
        </h2>
        
        <div className="flex-1 grid grid-cols-3 gap-8">
          {slide.metrics.map((metric, i) => (
            <div 
              key={i}
              className="rounded-lg p-8 flex flex-col items-center justify-center text-center"
              style={{ backgroundColor: colors.cardBg }}
            >
              <p className="text-lg opacity-70 mb-3" style={{ color: colors.text }}>
                {metric.label}
              </p>
              <p className="text-5xl font-bold mb-2" style={{ color: colors.primary }}>
                {metric.value}
              </p>
              {metric.change && (
                <p 
                  className="text-xl font-medium flex items-center gap-2"
                  style={{ color: metric.change > 0 ? '#10b981' : '#ef4444' }}
                >
                  {metric.change > 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  {metric.change > 0 ? '+' : ''}{metric.change}%
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Quote Slide
  if (slide.type === 'quote' && slide.quote) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-20">
        <QuoteIcon className="w-16 h-16 mb-8 opacity-30" style={{ color: colors.primary }} />
        <blockquote className="text-4xl font-light italic text-center mb-8" style={{ color: colors.text }}>
          "{slide.quote.text}"
        </blockquote>
        {slide.quote.author && (
          <p className="text-2xl font-medium" style={{ color: colors.accent }}>
            — {slide.quote.author}
          </p>
        )}
      </div>
    );
  }

  // Diagram Slide (Process Flow)
  if (slide.type === 'diagram' && slide.steps) {
    return (
      <div className="h-full flex flex-col p-12">
        <h2 className="text-4xl font-bold mb-12" style={{ color: colors.text }}>
          {slide.title}
        </h2>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-6">
            {slide.steps.map((step, i) => (
              <div key={i} className="flex items-center">
                <div 
                  className="rounded-lg p-6 flex flex-col items-center text-center min-w-[200px]"
                  style={{ backgroundColor: colors.cardBg }}
                >
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold mb-4"
                    style={{ backgroundColor: colors.primary, color: colors.text }}
                  >
                    {i + 1}
                  </div>
                  <p className="text-lg font-medium" style={{ color: colors.text }}>
                    {step}
                  </p>
                </div>
                {i < slide.steps.length - 1 && (
                  <div className="w-12 h-1" style={{ backgroundColor: colors.primary }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Image + Text Layout
  if (slide.type === 'image_text') {
    return (
      <div className="h-full grid grid-cols-2 gap-8 p-12">
        {/* Image placeholder */}
        <div 
          className="rounded-lg flex items-center justify-center"
          style={{ backgroundColor: colors.cardBg }}
        >
          <Icon className="w-32 h-32 opacity-30" style={{ color: colors.primary }} />
        </div>
        
        {/* Text content */}
        <div className="flex flex-col justify-center">
          <h2 className="text-4xl font-bold mb-6" style={{ color: colors.text }}>
            {slide.title}
          </h2>
          {slide.content && (
            <p className="text-2xl leading-relaxed mb-6 opacity-90" style={{ color: colors.text }}>
              {slide.content}
            </p>
          )}
          {slide.bullets && (
            <ul className="space-y-4">
              {slide.bullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-3 text-xl" style={{ color: colors.text }}>
                  <CheckCircle className="w-6 h-6 mt-1 flex-shrink-0" style={{ color: colors.primary }} />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  // Fallback: Simple content
  return (
    <div className="h-full flex flex-col items-center justify-center p-12 text-center">
      <h2 className="text-4xl font-bold mb-6" style={{ color: colors.text }}>
        {slide.title}
      </h2>
      {slide.content && (
        <p className="text-2xl max-w-3xl" style={{ color: colors.text }}>
          {slide.content}
        </p>
      )}
    </div>
  );
}
