/**
 * Migration 007: Proposify (Proposal Tool) Schema
 * 
 * Tables for client proposals, templates, and tracking.
 */

-- Proposal templates
CREATE TABLE IF NOT EXISTS proposal_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- onboarding, rollover, estate, tax, retirement, alternative
  template_data JSONB NOT NULL DEFAULT '{}', -- Sections, layout, defaults
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on category
CREATE INDEX IF NOT EXISTS idx_proposal_templates_category ON proposal_templates(category);
CREATE INDEX IF NOT EXISTS idx_proposal_templates_active ON proposal_templates(is_active);

-- Proposals
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id),
  template_id UUID REFERENCES proposal_templates(id),
  
  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- draft, sent, viewed, signed, declined, expired
  
  -- Client info
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255),
  portfolio_size NUMERIC(15,2),
  
  -- Fee structure
  fee_type VARCHAR(50) DEFAULT 'aum', -- aum, flat, hybrid
  fee_percentage NUMERIC(5,4), -- e.g., 0.0100 for 1.0%
  fee_flat NUMERIC(15,2), -- Flat fee amount
  fee_annual NUMERIC(15,2), -- Calculated annual fee
  
  -- Value calculations
  tax_alpha_percentage NUMERIC(5,4) DEFAULT 0.0200, -- 2% default (Farther's 1-3% range)
  tax_alpha_annual NUMERIC(15,2), -- Calculated tax alpha value
  net_value_annual NUMERIC(15,2), -- Tax alpha - fee
  roi_percentage NUMERIC(7,2), -- (Tax alpha / Fee) * 100
  
  -- Customization
  custom_sections JSONB DEFAULT '[]', -- Array of custom content blocks
  branding JSONB DEFAULT '{}', -- Logo URLs, colors, advisor info
  notes TEXT, -- Internal notes
  
  -- Tracking
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- Proposal expiration
  
  -- Documents
  pdf_url TEXT, -- S3/Backblaze URL
  pdf_generated_at TIMESTAMPTZ,
  signature_request_id VARCHAR(255), -- DocuSign/HelloSign ID
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID, -- Future: user management
  
  -- Audit
  CONSTRAINT proposals_fee_check CHECK (
    (fee_type = 'aum' AND fee_percentage IS NOT NULL) OR
    (fee_type = 'flat' AND fee_flat IS NOT NULL) OR
    (fee_type = 'hybrid' AND fee_percentage IS NOT NULL AND fee_flat IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_proposals_household ON proposals(household_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_sent_at ON proposals(sent_at);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON proposals(created_at DESC);

-- Proposal tracking events
CREATE TABLE IF NOT EXISTS proposal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
  
  -- Event details
  event_type VARCHAR(50) NOT NULL, -- sent, opened, viewed_section, downloaded, signed, declined
  event_data JSONB DEFAULT '{}', -- Additional context (section name, time spent, etc.)
  
  -- User agent (for analytics)
  user_agent TEXT,
  ip_address INET,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_proposal_events_proposal ON proposal_events(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_events_type ON proposal_events(event_type);
CREATE INDEX IF NOT EXISTS idx_proposal_events_created ON proposal_events(created_at DESC);

-- Seed default templates
INSERT INTO proposal_templates (name, description, category, template_data) VALUES
(
  'New Client Onboarding',
  'Standard proposal for new client relationships',
  'onboarding',
  '{
    "sections": [
      "cover",
      "introduction",
      "value_proposition",
      "fee_calculator",
      "service_comparison",
      "investment_approach",
      "tax_alpha_explanation",
      "next_steps",
      "disclosures"
    ],
    "defaults": {
      "fee_percentage": 0.0100,
      "tax_alpha_percentage": 0.0200
    }
  }'::jsonb
),
(
  '401(k) Rollover',
  'Proposal for 401(k) rollovers to IRA',
  'rollover',
  '{
    "sections": [
      "cover",
      "introduction",
      "rollover_benefits",
      "fee_calculator",
      "tax_optimization",
      "investment_approach",
      "next_steps",
      "disclosures"
    ],
    "defaults": {
      "fee_percentage": 0.0100,
      "tax_alpha_percentage": 0.0250
    }
  }'::jsonb
),
(
  'Tax Optimization',
  'Proposal focused on tax-efficient wealth management',
  'tax',
  '{
    "sections": [
      "cover",
      "introduction",
      "tax_alpha_explanation",
      "fee_calculator",
      "value_roi",
      "investment_approach",
      "next_steps",
      "disclosures"
    ],
    "defaults": {
      "fee_percentage": 0.0100,
      "tax_alpha_percentage": 0.0300
    }
  }'::jsonb
);

-- Comments
COMMENT ON TABLE proposals IS 'Client proposals with fee calculations and value propositions';
COMMENT ON TABLE proposal_templates IS 'Reusable proposal templates for different scenarios';
COMMENT ON TABLE proposal_events IS 'Tracking events for proposal opens, views, and signatures';
COMMENT ON COLUMN proposals.tax_alpha_percentage IS 'Farther tax optimization advantage (typically 1-3%)';
COMMENT ON COLUMN proposals.net_value_annual IS 'Annual value after fees (tax alpha - advisory fee)';
COMMENT ON COLUMN proposals.roi_percentage IS 'Return on investment percentage ((tax alpha / fee) * 100)';
