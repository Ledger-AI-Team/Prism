-- Migration 009: Narrative (Reporting) Schema

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id),
  report_type VARCHAR(50) NOT NULL, -- quarterly, annual, tax, custom
  title VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft', -- draft, generated, sent, archived
  period_start DATE,
  period_end DATE,
  content JSONB DEFAULT '{}', -- Sections and data
  pdf_url TEXT,
  pdf_generated_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_household ON reports(household_id);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- Report templates
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  report_type VARCHAR(50) NOT NULL,
  description TEXT,
  sections JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed templates
INSERT INTO report_templates (name, report_type, description, sections) VALUES
(
  'Quarterly Performance Review',
  'quarterly',
  'Standard quarterly performance report with allocation, returns, and commentary',
  '["executive_summary","performance_summary","asset_allocation","top_holdings","transactions","market_commentary","outlook","disclosures"]'::jsonb
),
(
  'Annual Tax Summary',
  'tax',
  'Year-end tax reporting with realized gains/losses and income',
  '["tax_summary","realized_gains","realized_losses","dividend_income","interest_income","tax_loss_harvesting_activity","disclosures"]'::jsonb
),
(
  'Annual Investment Review',
  'annual',
  'Comprehensive annual review with full year performance and planning updates',
  '["executive_summary","annual_performance","asset_allocation","benchmark_comparison","risk_metrics","tax_efficiency","planning_update","goals_progress","outlook","disclosures"]'::jsonb
);

COMMENT ON TABLE reports IS 'Generated client reports (quarterly, annual, tax, custom)';
COMMENT ON TABLE report_templates IS 'Reusable report templates with section configurations';
