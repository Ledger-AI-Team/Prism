-- ============================================================================
-- FARTHER PRISM - Financial Planning Platform
-- Planning & Tax Schema (Part 2)
-- 
-- Version: 1.0.0
-- Date: 2026-02-23
-- ============================================================================

-- ============================================================================
-- F. TAX SYSTEM
-- ============================================================================

-- Tax Profiles (household-level tax filing info)
CREATE TABLE tax_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    
    -- Filing details
    filing_status filing_status NOT NULL,
    
    -- Primary filer
    primary_filer_person_id UUID REFERENCES people(id),
    spouse_person_id UUID REFERENCES people(id),
    
    -- State details
    primary_state VARCHAR(2) NOT NULL,
    part_year_states VARCHAR(2)[],  -- For people moving mid-year
    
    -- Standard vs Itemized
    deduction_type VARCHAR(20) DEFAULT 'standard',  -- 'standard', 'itemized'
    itemized_deductions JSONB,  -- { "state_tax": 10000, "mortgage_interest": 15000, "charitable": 5000 }
    
    -- AGI adjustments
    traditional_401k_contrib NUMERIC(20,2),
    traditional_ira_contrib NUMERIC(20,2),
    hsa_contrib NUMERIC(20,2),
    
    -- Effective year
    tax_year INTEGER NOT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT tax_profiles_deduction_type_check CHECK (
        deduction_type IN ('standard', 'itemized')
    )
);

CREATE INDEX idx_tax_profiles_household ON tax_profiles(household_id);
CREATE INDEX idx_tax_profiles_year ON tax_profiles(tax_year);
CREATE UNIQUE INDEX idx_tax_profiles_household_year ON tax_profiles(household_id, tax_year);

-- Tax Rule Sets (versioned tax rules by jurisdiction)
CREATE TABLE tax_rule_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Jurisdiction
    jurisdiction VARCHAR(50) NOT NULL,  -- 'federal', 'AZ', 'CA', 'NY', etc.
    tax_year INTEGER NOT NULL,
    
    -- Rule payload (brackets, thresholds, rates)
    rules_json JSONB NOT NULL,
    /* Example structure:
    {
      "brackets": [
        { "min": 0, "max": 11000, "rate": 0.10 },
        { "min": 11000, "max": 44725, "rate": 0.12 },
        ...
      ],
      "standard_deduction": { "single": 13850, "married_joint": 27700, ... },
      "irmaa_thresholds": {
        "brackets": [
          { "min": 0, "max": 97000, "part_b_premium": 174.70, "part_d_premium": 0 },
          { "min": 97000, "max": 123000, "part_b_premium": 244.60, "part_d_premium": 12.20 },
          ...
        ]
      },
      "niit_threshold": { "single": 200000, "married_joint": 250000 },
      "niit_rate": 0.038,
      "capital_gains_brackets": [
        { "min": 0, "max": 44625, "rate": 0.00 },
        { "min": 44625, "max": 492300, "rate": 0.15 },
        { "min": 492300, "rate": 0.20 }
      ],
      "social_security_taxation": {
        "threshold_1": { "single": 25000, "married_joint": 32000 },
        "threshold_2": { "single": 34000, "married_joint": 44000 }
      }
    }
    */
    
    -- Metadata
    effective_start DATE NOT NULL,
    effective_end DATE,
    
    -- Version control
    version VARCHAR(20) NOT NULL,
    supersedes_id UUID REFERENCES tax_rule_sets(id),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tax_rule_sets_jurisdiction ON tax_rule_sets(jurisdiction);
CREATE INDEX idx_tax_rule_sets_year ON tax_rule_sets(tax_year);
CREATE UNIQUE INDEX idx_tax_rule_sets_unique_version ON tax_rule_sets(jurisdiction, tax_year, version);

-- ============================================================================
-- G. ASSUMPTIONS & VERSIONING
-- ============================================================================

-- Plans (top-level container)
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    
    -- Plan details
    plan_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft',  -- 'draft', 'active', 'archived'
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    
    CONSTRAINT plans_status_check CHECK (status IN ('draft', 'active', 'archived'))
);

CREATE INDEX idx_plans_household ON plans(household_id);
CREATE INDEX idx_plans_status ON plans(status);

-- Scenarios (variations within a plan)
CREATE TABLE scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    
    -- Scenario details
    scenario_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scenarios_plan ON scenarios(plan_id);

-- Return Models (Capital Market Assumptions)
CREATE TABLE return_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Model details
    model_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Expected returns by asset class
    expected_returns JSONB NOT NULL,
    /* Example:
    {
      "us_equity_large": 0.10,
      "us_equity_small": 0.11,
      "intl_equity_developed": 0.09,
      "intl_equity_emerging": 0.10,
      "fixed_income_core": 0.04,
      "fixed_income_high_yield": 0.06,
      "real_estate": 0.08,
      "commodities": 0.05,
      "cash": 0.03
    }
    */
    
    -- Covariance matrix
    covariance_matrix JSONB NOT NULL,
    /* Example (condensed):
    {
      "rows": ["us_equity_large", "us_equity_small", ...],
      "matrix": [
        [0.0400, 0.0350, ...],
        [0.0350, 0.0500, ...],
        ...
      ]
    }
    */
    
    -- Fat tail parameters (optional)
    fat_tail_params JSONB,
    
    -- Validity
    effective_start DATE NOT NULL,
    effective_end DATE,
    
    -- Version
    version VARCHAR(20) NOT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_return_models_effective ON return_models(effective_start, effective_end);

-- Assumption Sets (immutable snapshot)
CREATE TABLE assumption_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
    
    -- Valuation date
    valuation_as_of_date DATE NOT NULL,
    
    -- Inflation assumptions
    inflation_cpi NUMERIC(5,4) NOT NULL,
    healthcare_inflation NUMERIC(5,4) NOT NULL,
    education_inflation NUMERIC(5,4),
    
    -- Longevity assumptions
    longevity_table VARCHAR(50),  -- 'SSA_2020', 'IAM_2012', etc.
    longevity_adjustment INTEGER DEFAULT 0,  -- Years adjustment (e.g., +5 for longevity risk)
    
    -- Return model
    return_model_id UUID NOT NULL REFERENCES return_models(id),
    
    -- Tax rules
    tax_rule_set_federal_id UUID NOT NULL REFERENCES tax_rule_sets(id),
    tax_rule_set_state_id UUID REFERENCES tax_rule_sets(id),
    
    -- Withdrawal assumptions
    safe_withdrawal_rate NUMERIC(5,4),
    
    -- Other
    social_security_cola NUMERIC(5,4) DEFAULT 0.025,
    
    -- Version hash (for reproducibility)
    version_hash VARCHAR(64) NOT NULL,  -- SHA256 hash of all inputs
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assumption_sets_scenario ON assumption_sets(scenario_id);
CREATE INDEX idx_assumption_sets_return_model ON assumption_sets(return_model_id);
CREATE UNIQUE INDEX idx_assumption_sets_version_hash ON assumption_sets(version_hash);

-- ============================================================================
-- H. PLAN RUN OUTPUTS (Derived, never directly edited)
-- ============================================================================

-- Plan Runs (execution records)
CREATE TABLE plan_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
    assumption_set_id UUID NOT NULL REFERENCES assumption_sets(id),
    
    -- Run configuration
    run_type run_type NOT NULL,
    run_name VARCHAR(255),
    
    -- Monte Carlo specific
    num_simulations INTEGER,
    random_seed INTEGER,  -- For reproducibility
    
    -- Optimization specific
    optimization_objective VARCHAR(100),
    optimization_constraints JSONB,
    
    -- Horizon
    horizon_years INTEGER NOT NULL,
    horizon_months INTEGER GENERATED ALWAYS AS (horizon_years * 12) STORED,
    
    -- Status
    run_status run_status NOT NULL DEFAULT 'queued',
    progress_percentage INTEGER DEFAULT 0,
    
    -- Timing
    queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Results summary
    success_probability NUMERIC(5,4),
    median_terminal_wealth NUMERIC(20,2),
    p10_terminal_wealth NUMERIC(20,2),
    p90_terminal_wealth NUMERIC(20,2),
    max_drawdown_median NUMERIC(5,4),
    
    -- Error handling
    error_message TEXT,
    
    -- Engine metadata
    engine_version VARCHAR(20),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT plan_runs_progress_check CHECK (
        progress_percentage BETWEEN 0 AND 100
    )
);

CREATE INDEX idx_plan_runs_scenario ON plan_runs(scenario_id);
CREATE INDEX idx_plan_runs_assumption_set ON plan_runs(assumption_set_id);
CREATE INDEX idx_plan_runs_status ON plan_runs(run_status);
CREATE INDEX idx_plan_runs_queued ON plan_runs(queued_at DESC);

-- Projection Timeseries (materialized output)
CREATE TABLE projection_timeseries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_run_id UUID NOT NULL REFERENCES plan_runs(id) ON DELETE CASCADE,
    
    -- Dimension (what is being projected)
    dimension VARCHAR(100) NOT NULL,
    /* Common dimensions:
       - 'portfolio_value'
       - 'portfolio_value_taxable'
       - 'portfolio_value_deferred'
       - 'portfolio_value_roth'
       - 'income_total'
       - 'expenses_total'
       - 'taxes_total'
       - 'taxes_federal'
       - 'taxes_state'
       - 'taxes_irmaa'
       - 'cash_flow_net'
       - 'withdrawals_total'
       - 'goal_funding_{goal_id}'
    */
    
    -- Time
    time_period VARCHAR(7) NOT NULL,  -- 'YYYY-MM' format
    time_index INTEGER NOT NULL,  -- 0-based month index
    
    -- Value
    value NUMERIC(20,2) NOT NULL,
    
    -- Percentile (for Monte Carlo runs)
    percentile INTEGER,  -- NULL for deterministic, 10/50/90 for MC
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projection_timeseries_run ON projection_timeseries(plan_run_id);
CREATE INDEX idx_projection_timeseries_dimension ON projection_timeseries(dimension);
CREATE INDEX idx_projection_timeseries_period ON projection_timeseries(time_period);
CREATE INDEX idx_projection_timeseries_composite ON projection_timeseries(
    plan_run_id, dimension, time_index, percentile
);

-- Monte Carlo Distribution Summary
CREATE TABLE mc_distribution_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_run_id UUID NOT NULL REFERENCES plan_runs(id) ON DELETE CASCADE,
    
    -- Goal-level success
    goal_id UUID REFERENCES goals(id),
    goal_success_probability NUMERIC(5,4),
    
    -- Wealth distribution
    terminal_wealth_p01 NUMERIC(20,2),
    terminal_wealth_p05 NUMERIC(20,2),
    terminal_wealth_p10 NUMERIC(20,2),
    terminal_wealth_p25 NUMERIC(20,2),
    terminal_wealth_p50 NUMERIC(20,2),
    terminal_wealth_p75 NUMERIC(20,2),
    terminal_wealth_p90 NUMERIC(20,2),
    terminal_wealth_p95 NUMERIC(20,2),
    terminal_wealth_p99 NUMERIC(20,2),
    
    -- Risk metrics
    max_drawdown_p50 NUMERIC(5,4),
    max_drawdown_p90 NUMERIC(5,4),
    shortfall_risk NUMERIC(5,4),
    
    -- Tax metrics
    lifetime_taxes_p50 NUMERIC(20,2),
    lifetime_taxes_p90 NUMERIC(20,2),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mc_distribution_summaries_run ON mc_distribution_summaries(plan_run_id);
CREATE INDEX idx_mc_distribution_summaries_goal ON mc_distribution_summaries(goal_id);

-- Recommendations (AI-generated opportunities)
CREATE TABLE recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_run_id UUID NOT NULL REFERENCES plan_runs(id) ON DELETE CASCADE,
    
    -- Recommendation details
    category recommendation_category NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- Impact estimate
    impact_estimate JSONB,
    /* Example:
    {
      "tax_savings_lifetime": 45000,
      "probability_increase": 0.03,
      "terminal_wealth_increase": 75000,
      "confidence": 0.85
    }
    */
    
    -- Confidence score
    confidence_score NUMERIC(3,2),  -- 0.00 to 1.00
    
    -- Priority
    priority INTEGER DEFAULT 3,  -- 1 (highest) to 5 (lowest)
    
    -- Approval workflow
    requires_advisor_approval BOOLEAN DEFAULT true,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    approval_status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'approved', 'rejected', 'implemented'
    
    -- Implementation
    implementation_notes TEXT,
    implemented_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT recommendations_confidence_check CHECK (
        confidence_score IS NULL OR (confidence_score BETWEEN 0 AND 1)
    ),
    CONSTRAINT recommendations_priority_check CHECK (priority BETWEEN 1 AND 5),
    CONSTRAINT recommendations_approval_status_check CHECK (
        approval_status IN ('pending', 'approved', 'rejected', 'implemented')
    )
);

CREATE INDEX idx_recommendations_run ON recommendations(plan_run_id);
CREATE INDEX idx_recommendations_category ON recommendations(category);
CREATE INDEX idx_recommendations_priority ON recommendations(priority);
CREATE INDEX idx_recommendations_approval_status ON recommendations(approval_status);

-- ============================================================================
-- I. INTEGRATIONS & AUDIT
-- ============================================================================

-- External Links (CRM, custodians, aggregators)
CREATE TABLE external_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    
    -- External system
    system_name VARCHAR(100) NOT NULL,  -- 'hubspot', 'salesforce', 'orion', 'schwab', 'fidelity', 'plaid'
    external_id VARCHAR(255) NOT NULL,
    
    -- Link type
    link_type VARCHAR(50),  -- 'crm_contact', 'custodial_account', 'aggregator_connection'
    
    -- Metadata
    metadata JSONB,
    
    -- Sync
    last_synced_at TIMESTAMPTZ,
    sync_status VARCHAR(50),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_external_links_household ON external_links(household_id);
CREATE INDEX idx_external_links_system ON external_links(system_name);
CREATE UNIQUE INDEX idx_external_links_unique ON external_links(system_name, external_id);

-- Audit Log (immutable trail)
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Who
    user_id UUID,
    user_email VARCHAR(255),
    user_role VARCHAR(50),
    
    -- What
    action VARCHAR(100) NOT NULL,  -- 'create', 'update', 'delete', 'view', 'export', 'run'
    entity_type VARCHAR(100) NOT NULL,  -- 'household', 'plan', 'run', 'recommendation'
    entity_id UUID NOT NULL,
    
    -- Changes (for updates)
    old_values JSONB,
    new_values JSONB,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    
    -- When
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Metadata
    metadata JSONB
);

CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp DESC);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);

-- ============================================================================
-- Continued in 03-views-functions.sql
-- ============================================================================
