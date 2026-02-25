/**
 * Narrative Service - Client Reporting Engine
 * 
 * Generates quarterly reviews, annual summaries, tax reports,
 * and custom reports with Farther branding.
 */

import pool from '../db/pool.js';
import { FocusService } from './focus-service.js';

const focusService = new FocusService();

export class NarrativeService {

  /**
   * Create a new report.
   */
  async createReport(data) {
    const {
      householdId,
      reportType,
      title,
      periodStart,
      periodEnd,
      templateId,
    } = data;

    // Generate content based on report type
    const content = await this.generateContent(householdId, reportType, periodStart, periodEnd);

    const result = await pool.query(`
      INSERT INTO reports (household_id, report_type, title, period_start, period_end, content)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [householdId, reportType, title, periodStart, periodEnd, JSON.stringify(content)]);

    return result.rows[0];
  }

  /**
   * Generate report content from portfolio data.
   */
  async generateContent(householdId, reportType, periodStart, periodEnd) {
    const content = {};

    try {
      // Get portfolio data
      const overview = await focusService.getOverview(householdId);
      const performance = await focusService.getPerformance(householdId);
      const fees = await focusService.analyzeFees(householdId);

      content.executiveSummary = {
        totalValue: overview.totalValue,
        totalGainLoss: overview.totalGainLoss,
        returnPct: overview.returnPct,
        accountCount: overview.accountCount,
        holdingCount: overview.holdingCount,
        periodStart,
        periodEnd,
      };

      content.performanceSummary = {
        totalReturn: performance.totalReturn,
        totalValue: performance.totalValue,
        totalCost: performance.totalCost,
        attribution: performance.attribution,
        topPerformers: performance.topPerformers,
        bottomPerformers: performance.bottomPerformers,
      };

      content.assetAllocation = overview.allocation;
      content.concentrationRisks = overview.concentrations;

      content.feeAnalysis = {
        weightedExpenseRatio: fees.weightedExpenseRatio,
        totalAnnualCost: fees.totalAnnualCost,
      };

      // Add tax data for tax reports
      if (reportType === 'tax' || reportType === 'annual') {
        try {
          const taxLoss = await focusService.scanTaxLossOpportunities(householdId);
          content.taxSummary = {
            harvestingOpportunities: taxLoss.count,
            potentialSavings: taxLoss.totalPotentialSavings,
          };
        } catch (e) {
          content.taxSummary = { note: 'Tax data unavailable' };
        }
      }

      // Market commentary (static for now, will be AI-generated later)
      content.marketCommentary = this.getMarketCommentary(reportType);

    } catch (error) {
      console.error('[Narrative] Error generating content:', error.message);
      content.error = `Failed to generate some sections: ${error.message}`;
    }

    return content;
  }

  /**
   * Get market commentary (placeholder - will be AI-generated).
   */
  getMarketCommentary(reportType) {
    return {
      headline: 'Market Overview',
      body: `Markets continued to evolve during this period. Farther's preservation-first approach and active tax management helped protect and grow client portfolios. Our technology-driven tax optimization continued to deliver measurable alpha, with systematic tax-loss harvesting and strategic asset location contributing to after-tax returns.`,
      outlook: `We remain focused on preservation-first portfolio management with an emphasis on tax efficiency. Our proprietary technology continues to identify opportunities for tax-loss harvesting, Roth conversions, and withdrawal optimization.`,
      disclaimer: 'This commentary is for informational purposes only and does not constitute investment advice.',
    };
  }

  /**
   * Get report by ID.
   */
  async getReport(reportId) {
    const result = await pool.query('SELECT * FROM reports WHERE id = $1', [reportId]);
    if (result.rows.length === 0) throw new Error(`Report ${reportId} not found`);
    return result.rows[0];
  }

  /**
   * List reports for a household.
   */
  async listReports(householdId, filters = {}) {
    const { reportType, status, limit = 50 } = filters;
    const conditions = ['household_id = $1'];
    const values = [householdId];
    let idx = 2;

    if (reportType) {
      conditions.push(`report_type = $${idx}`);
      values.push(reportType);
      idx++;
    }
    if (status) {
      conditions.push(`status = $${idx}`);
      values.push(status);
      idx++;
    }

    values.push(limit);
    const result = await pool.query(`
      SELECT * FROM reports
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT $${idx}
    `, values);

    return result.rows;
  }

  /**
   * List report templates.
   */
  async listTemplates(reportType = null) {
    const query = reportType
      ? 'SELECT * FROM report_templates WHERE report_type = $1 AND is_active = TRUE ORDER BY name'
      : 'SELECT * FROM report_templates WHERE is_active = TRUE ORDER BY report_type, name';
    const params = reportType ? [reportType] : [];
    return (await pool.query(query, params)).rows;
  }

  /**
   * Generate report HTML (for PDF).
   */
  generateHTML(report) {
    const content = report.content || {};
    const es = content.executiveSummary || {};
    const perf = content.performanceSummary || {};
    const commentary = content.marketCommentary || {};

    const fmt = (n) => (n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    const pct = (n) => ((n || 0) * 100).toFixed(1) + '%';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', -apple-system, sans-serif; color: #333; line-height: 1.6; }
          .page { page-break-after: always; padding: 40px; }
          .page:last-child { page-break-after: auto; }
          h1 { font-size: 28px; color: #1a7a82; margin-bottom: 20px; }
          h2 { font-size: 20px; color: #1a7a82; margin: 25px 0 12px; }
          h3 { font-size: 16px; margin: 15px 0 8px; }
          p { margin-bottom: 12px; font-size: 13px; }
          .header { text-align: center; margin-bottom: 40px; }
          .header h1 { font-size: 36px; }
          .metric-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
          .metric { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
          .metric .value { font-size: 24px; font-weight: 700; color: #1a7a82; }
          .metric .label { font-size: 12px; color: #666; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e0e0e0; font-size: 13px; }
          th { background: #1a7a82; color: white; }
          .highlight { background: #f0f9fa; padding: 15px; border-left: 4px solid #1a7a82; margin: 15px 0; }
          .footer { margin-top: 40px; padding-top: 15px; border-top: 2px solid #1a7a82; text-align: center; font-size: 11px; color: #666; }
          .positive { color: #16a34a; }
          .negative { color: #dc2626; }
        </style>
      </head>
      <body>
        <!-- Cover -->
        <div class="page">
          <div class="header" style="padding-top: 150px;">
            <h1 style="font-size: 36px; color: #1a7a82;">FARTHER</h1>
            <p style="font-size: 20px; color: #1a7a82; margin: 20px 0;">${report.title}</p>
            <p style="font-size: 14px; color: #666;">
              ${es.periodStart ? new Date(es.periodStart).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''} —
              ${es.periodEnd ? new Date(es.periodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
            </p>
          </div>
        </div>

        <!-- Executive Summary -->
        <div class="page">
          <h1>Executive Summary</h1>
          <div class="metric-grid">
            <div class="metric">
              <div class="value">$${fmt(es.totalValue)}</div>
              <div class="label">Portfolio Value</div>
            </div>
            <div class="metric">
              <div class="value ${(es.totalGainLoss || 0) >= 0 ? 'positive' : 'negative'}">
                ${(es.totalGainLoss || 0) >= 0 ? '+' : ''}$${fmt(es.totalGainLoss)}
              </div>
              <div class="label">Total Gain/Loss</div>
            </div>
            <div class="metric">
              <div class="value ${(es.returnPct || 0) >= 0 ? 'positive' : 'negative'}">
                ${pct(es.returnPct)}
              </div>
              <div class="label">Return</div>
            </div>
          </div>
          <p>
            Your portfolio consists of ${es.holdingCount || 0} holdings across ${es.accountCount || 0} accounts.
            Farther's preservation-first approach continues to protect your wealth while our tax optimization
            technology works to deliver measurable alpha.
          </p>
        </div>

        <!-- Performance -->
        <div class="page">
          <h1>Performance Summary</h1>
          ${perf.topPerformers ? `
            <h2>Top Performers</h2>
            <table>
              <tr><th>Symbol</th><th>Value</th><th>Gain/Loss</th><th>Return</th></tr>
              ${(perf.topPerformers || []).map(p => `
                <tr>
                  <td><strong>${p.symbol}</strong></td>
                  <td>$${fmt(p.value)}</td>
                  <td class="${p.gain >= 0 ? 'positive' : 'negative'}">${p.gain >= 0 ? '+' : ''}$${fmt(p.gain)}</td>
                  <td class="${p.returnPct >= 0 ? 'positive' : 'negative'}">${pct(p.returnPct)}</td>
                </tr>
              `).join('')}
            </table>
          ` : ''}

          ${perf.bottomPerformers ? `
            <h2>Underperformers</h2>
            <table>
              <tr><th>Symbol</th><th>Value</th><th>Gain/Loss</th><th>Return</th></tr>
              ${(perf.bottomPerformers || []).map(p => `
                <tr>
                  <td><strong>${p.symbol}</strong></td>
                  <td>$${fmt(p.value)}</td>
                  <td class="${p.gain >= 0 ? 'positive' : 'negative'}">${p.gain >= 0 ? '+' : ''}$${fmt(p.gain)}</td>
                  <td class="${p.returnPct >= 0 ? 'positive' : 'negative'}">${pct(p.returnPct)}</td>
                </tr>
              `).join('')}
            </table>
          ` : ''}
        </div>

        <!-- Market Commentary -->
        <div class="page">
          <h1>${commentary.headline || 'Market Commentary'}</h1>
          <p>${commentary.body || ''}</p>
          <h2>Outlook</h2>
          <p>${commentary.outlook || ''}</p>
          <div class="highlight">
            <p><em>${commentary.disclaimer || ''}</em></p>
          </div>

          <div class="footer">
            <p>Farther Advisors LLC | Registered Investment Advisor</p>
            <p>© ${new Date().getFullYear()} Farther. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export default NarrativeService;
