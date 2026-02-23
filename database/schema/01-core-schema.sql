-- ============================================================================
-- FARTHER PRISM - Financial Planning Platform
-- Core Database Schema - PostgreSQL 15+
-- 
-- Version: 1.0.0
-- Date: 2026-02-23
-- Author: Ledger (Ledger@The-AI-Team.io)
-- 
-- Performance Targets:
--   - CRUD operations: <100ms
--   - Household queries: <50ms
--   - Timeseries fetch: <200ms (paginated)
-- 
-- Security:
--   - PII encrypted at rest (SSN, tax IDs)
--   - Row-level security enabled
--   - Audit triggers on all mutations
-- ============================================================================

-- ============================================================================
-- EXTENSIONS & CONFIGURATION
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Enable Row-Level Security globally
ALTER DATABASE CURRENT SET row_security = on;

-- ============================================================================
-- ENUMERATIONS
-- ============================================================================

CREATE TYPE account_type AS ENUM (
    'taxable',
    'ira_traditional',
    'ira_roth',
    'ira_sep',
    'ira_simple',
    '401k_traditional',
    '401k_roth',
    '403b',
    '457',
    'pension',
    '529_education',
    'hsa',
    'trust',
    'annuity',
    'cash',
    'other'
);

CREATE TYPE entity_type AS ENUM (
    'revocable_trust',
    'irrevocable_trust',
    'grantor_trust',
    'charitable_trust',
    'llc',
    'partnership',
    's_corp',
    'c_corp',
    'foundation',
    'daf',
    'other'
);

CREATE TYPE relationship_type AS ENUM (
    'spouse',
    'child',
    'parent',
    'sibling',
    'dependent',
    'beneficiary',
    'trustee',
    'executor',
    'other'
);

CREATE TYPE income_type AS ENUM (
    'w2_salary',
    'w2_bonus',
    '1099_contract',
    '1099_interest',
    '1099_dividend',
    'pension',
    'social_security',
    'rental_income',
    'business_income',
    'k1_partnership',
    'k1_trust',
    'royalty',
    'annuity_payment',
    'other'
);

CREATE TYPE tax_character AS ENUM (
    'ordinary',
    'qualified_dividend',
    'long_term_cap_gain',
    'short_term_cap_gain',
    'tax_exempt',
    'return_of_capital'
);

CREATE TYPE goal_type AS ENUM (
    'retirement',
    'education',
    'home_purchase',
    'legacy',
    'major_purchase',
    'liquidity_reserve',
    'healthcare',
    'charitable',
    'other'
);

CREATE TYPE constraint_type AS ENUM (
    'min_cash_balance',
    'max_tax_bracket',
    'max_irmaa_tier',
    'min_legacy_amount',
    'max_withdrawal_rate',
    'max_portfolio_concentration',
    'min_insurance_coverage',
    'other'
);

CREATE TYPE run_type AS ENUM (
    'deterministic',
    'monte_carlo',
    'optimization'
);

CREATE TYPE run_status AS ENUM (
    'queued',
    'running',
    'complete',
    'failed',
    'cancelled'
);

CREATE TYPE recommendation_category AS ENUM (
    'tax',
    'retirement',
    'insurance',
    'investment',
    'estate',
    'healthcare',
    'education',
    'other'
);

CREATE TYPE filing_status AS ENUM (
    'single',
    'married_joint',
    'married_separate',
    'head_of_household',
    'qualifying_widow'
);

-- ============================================================================
-- A. CORE IDENTITY GRAPH
-- ============================================================================

-- Households (root node)
CREATE TABLE households (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    primary_advisor_id UUID,  -- Foreign key to advisors (not shown)
    service_tier VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    
    -- Metadata
    external_crm_id VARCHAR(255),
    tags TEXT[],
    notes TEXT,
    
    CONSTRAINT households_status_check CHECK (status IN ('active', 'inactive', 'archived'))
);

CREATE INDEX idx_households_advisor ON households(primary_advisor_id);
CREATE INDEX idx_households_status ON households(status);
CREATE INDEX idx_households_external_crm ON households(external_crm_id);

-- People (household members)
CREATE TABLE people (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    
    -- Identity
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    legal_name VARCHAR(255),
    preferred_name VARCHAR(100),
    
    -- Demographics
    dob DATE NOT NULL,
    dod DATE,  -- Date of death (for legacy planning)
    ssn_encrypted BYTEA,  -- Encrypted SSN
    ssn_last4 VARCHAR(4),  -- Last 4 for display
    
    -- Location & Citizenship
    citizenship VARCHAR(3) DEFAULT 'USA',
    state_residence VARCHAR(2) NOT NULL,
    tax_domicile VARCHAR(2),
    
    -- Health (for actuarial modeling)
    health_rating VARCHAR(20),  -- excellent, good, fair, poor
    smoker_flag BOOLEAN DEFAULT false,
    
    -- Status
    is_primary BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'active',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT people_health_rating_check CHECK (
        health_rating IN ('excellent', 'good', 'fair', 'poor', 'unknown')
    )
);

CREATE INDEX idx_people_household ON people(household_id);
CREATE INDEX idx_people_dob ON people(dob);
CREATE INDEX idx_people_state ON people(state_residence);
CREATE UNIQUE INDEX idx_people_primary_per_household ON people(household_id, is_primary) 
    WHERE is_primary = true;

-- Entities (trusts, LLCs, etc.)
CREATE TABLE entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    
    -- Identity
    entity_name VARCHAR(255) NOT NULL,
    entity_type entity_type NOT NULL,
    tax_id_encrypted BYTEA,
    tax_id_last4 VARCHAR(4),
    
    -- Formation details
    state_of_formation VARCHAR(2),
    formation_date DATE,
    
    -- Tax treatment
    pass_through BOOLEAN DEFAULT true,
    filing_status VARCHAR(50),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_entities_household ON entities(household_id);
CREATE INDEX idx_entities_type ON entities(entity_type);

-- Relationships (between people)
CREATE TABLE relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    related_person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    
    relationship_type relationship_type NOT NULL,
    
    -- Dependency details
    dependent BOOLEAN DEFAULT false,
    support_percentage NUMERIC(5,2),  -- % financial support
    
    effective_start DATE,
    effective_end DATE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT relationships_no_self_ref CHECK (person_id != related_person_id),
    CONSTRAINT relationships_support_pct_check CHECK (
        support_percentage IS NULL OR (support_percentage >= 0 AND support_percentage <= 100)
    )
);

CREATE INDEX idx_relationships_household ON relationships(household_id);
CREATE INDEX idx_relationships_person ON relationships(person_id);
CREATE INDEX idx_relationships_related ON relationships(related_person_id);
CREATE UNIQUE INDEX idx_relationships_unique ON relationships(person_id, related_person_id, relationship_type);

-- Ownership (generic ownership graph)
CREATE TABLE ownership (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    
    -- Owner (person or entity)
    owner_person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    owner_entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    
    -- Owned object (account, entity, property, etc.)
    owned_account_id UUID,  -- FK to accounts
    owned_entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    
    -- Ownership details
    ownership_percentage NUMERIC(5,2) NOT NULL DEFAULT 100.00,
    ownership_type VARCHAR(50),  -- 'direct', 'beneficial', 'trustee'
    
    effective_start DATE,
    effective_end DATE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT ownership_one_owner CHECK (
        (owner_person_id IS NOT NULL AND owner_entity_id IS NULL) OR
        (owner_person_id IS NULL AND owner_entity_id IS NOT NULL)
    ),
    CONSTRAINT ownership_one_owned CHECK (
        (owned_account_id IS NOT NULL AND owned_entity_id IS NULL) OR
        (owned_account_id IS NULL AND owned_entity_id IS NOT NULL)
    ),
    CONSTRAINT ownership_percentage_check CHECK (
        ownership_percentage > 0 AND ownership_percentage <= 100
    )
);

CREATE INDEX idx_ownership_household ON ownership(household_id);
CREATE INDEX idx_ownership_owner_person ON ownership(owner_person_id);
CREATE INDEX idx_ownership_owner_entity ON ownership(owner_entity_id);
CREATE INDEX idx_ownership_account ON ownership(owned_account_id);

-- ============================================================================
-- B. ACCOUNTS & HOLDINGS
-- ============================================================================

-- Accounts
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    
    -- Account details
    account_type account_type NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    custodian VARCHAR(100),
    account_number_encrypted BYTEA,
    account_number_masked VARCHAR(20),
    
    -- Tax treatment (derived from account_type)
    tax_treatment VARCHAR(20) NOT NULL,  -- 'taxable', 'deferred', 'free'
    
    -- Registration
    registration_type VARCHAR(50),  -- 'individual', 'joint', 'trust', 'entity'
    
    -- Dates
    opened_date DATE,
    closed_date DATE,
    
    -- Data source
    data_source VARCHAR(50),  -- 'manual', 'plaid', 'orion', 'schwab', 'fidelity'
    external_account_id VARCHAR(255),
    last_synced_at TIMESTAMPTZ,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT accounts_tax_treatment_check CHECK (
        tax_treatment IN ('taxable', 'deferred', 'free')
    ),
    CONSTRAINT accounts_status_check CHECK (
        status IN ('active', 'closed', 'archived')
    )
);

CREATE INDEX idx_accounts_household ON accounts(household_id);
CREATE INDEX idx_accounts_type ON accounts(account_type);
CREATE INDEX idx_accounts_custodian ON accounts(custodian);
CREATE INDEX idx_accounts_status ON accounts(status);
CREATE INDEX idx_accounts_external ON accounts(external_account_id);

-- Security Master (reference data)
CREATE TABLE security_master (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identifiers
    symbol VARCHAR(20) NOT NULL,
    cusip VARCHAR(9),
    isin VARCHAR(12),
    
    -- Descriptive
    name VARCHAR(255) NOT NULL,
    security_type VARCHAR(50) NOT NULL,  -- 'stock', 'bond', 'fund', 'etf', 'option', 'cash'
    
    -- Asset class mapping
    asset_class VARCHAR(50),  -- 'us_equity', 'intl_equity', 'fixed_income', 'real_estate', 'commodities', 'cash'
    
    -- Market data
    exchange VARCHAR(20),
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Status
    active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_security_master_symbol ON security_master(symbol);
CREATE INDEX idx_security_master_cusip ON security_master(cusip);
CREATE INDEX idx_security_master_asset_class ON security_master(asset_class);

-- Positions (holdings within accounts)
CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    security_id UUID NOT NULL REFERENCES security_master(id),
    
    -- Holding details
    quantity NUMERIC(20,8) NOT NULL,
    price NUMERIC(20,4) NOT NULL,
    market_value NUMERIC(20,2) NOT NULL,
    
    -- Cost basis (aggregate for position)
    cost_basis_total NUMERIC(20,2),
    unrealized_gain_loss NUMERIC(20,2),
    
    -- Snapshot time
    as_of_date DATE NOT NULL,
    as_of_datetime TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT positions_quantity_positive CHECK (quantity >= 0),
    CONSTRAINT positions_price_positive CHECK (price >= 0),
    CONSTRAINT positions_market_value_consistent CHECK (
        ABS(market_value - (quantity * price)) < 0.01
    )
);

CREATE INDEX idx_positions_account ON positions(account_id);
CREATE INDEX idx_positions_security ON positions(security_id);
CREATE INDEX idx_positions_as_of ON positions(as_of_date DESC);
CREATE UNIQUE INDEX idx_positions_unique_snapshot ON positions(account_id, security_id, as_of_datetime);

-- Tax Lots (for taxable accounts only)
CREATE TABLE lots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    security_id UUID NOT NULL REFERENCES security_master(id),
    
    -- Lot details
    acquire_date DATE NOT NULL,
    quantity NUMERIC(20,8) NOT NULL,
    cost_basis_per_share NUMERIC(20,4) NOT NULL,
    cost_basis_total NUMERIC(20,2) NOT NULL,
    
    -- Tax attributes
    term VARCHAR(10) GENERATED ALWAYS AS (
        CASE WHEN acquire_date <= CURRENT_DATE - INTERVAL '1 year' 
             THEN 'long' 
             ELSE 'short' 
        END
    ) STORED,
    wash_sale_flag BOOLEAN DEFAULT false,
    
    -- Disposal (if sold)
    disposed_date DATE,
    disposed_quantity NUMERIC(20,8),
    disposed_proceeds NUMERIC(20,2),
    realized_gain_loss NUMERIC(20,2),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT lots_quantity_positive CHECK (quantity > 0),
    CONSTRAINT lots_disposed_quantity_check CHECK (
        disposed_quantity IS NULL OR (disposed_quantity > 0 AND disposed_quantity <= quantity)
    )
);

CREATE INDEX idx_lots_account ON lots(account_id);
CREATE INDEX idx_lots_security ON lots(security_id);
CREATE INDEX idx_lots_acquire_date ON lots(acquire_date);
CREATE INDEX idx_lots_term ON lots(term);

-- Cash Movements (deposits, withdrawals, dividends, RMDs)
CREATE TABLE cash_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    
    -- Movement details
    movement_date DATE NOT NULL,
    movement_type VARCHAR(50) NOT NULL,  -- 'deposit', 'withdrawal', 'dividend', 'interest', 'rmd', 'fee'
    amount NUMERIC(20,2) NOT NULL,
    
    -- Tax implications
    tax_character tax_character,
    taxable_amount NUMERIC(20,2),
    
    -- Linkage
    related_goal_id UUID,  -- FK to goals
    related_plan_run_id UUID,  -- FK to plan_runs
    
    description TEXT,
    external_transaction_id VARCHAR(255),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cash_movements_account ON cash_movements(account_id);
CREATE INDEX idx_cash_movements_date ON cash_movements(movement_date DESC);
CREATE INDEX idx_cash_movements_type ON cash_movements(movement_type);
CREATE INDEX idx_cash_movements_goal ON cash_movements(related_goal_id);

-- ============================================================================
-- C. INCOME & EXPENSES
-- ============================================================================

-- Expense Categories
CREATE TABLE expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    category_name VARCHAR(100) NOT NULL UNIQUE,
    parent_category_id UUID REFERENCES expense_categories(id),
    
    is_discretionary BOOLEAN DEFAULT false,
    default_inflation_rate NUMERIC(5,4),
    
    display_order INTEGER,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expense_categories_parent ON expense_categories(parent_category_id);

-- Income Streams
CREATE TABLE income_streams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    person_id UUID REFERENCES people(id) ON DELETE SET NULL,
    entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,
    
    -- Stream details
    income_type income_type NOT NULL,
    description VARCHAR(255) NOT NULL,
    
    -- Amount & frequency
    base_amount NUMERIC(20,2) NOT NULL,
    amount_frequency VARCHAR(20) NOT NULL,  -- 'monthly', 'quarterly', 'annual', 'bi_weekly'
    
    -- Growth
    growth_rate NUMERIC(5,4) DEFAULT 0,
    inflation_indexed BOOLEAN DEFAULT false,
    
    -- Tax
    tax_character tax_character DEFAULT 'ordinary',
    
    -- Timing
    start_date DATE NOT NULL,
    end_date DATE,
    
    -- Status
    active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT income_streams_amount_frequency_check CHECK (
        amount_frequency IN ('weekly', 'bi_weekly', 'semi_monthly', 'monthly', 'quarterly', 'annual', 'one_time')
    ),
    CONSTRAINT income_streams_amount_positive CHECK (base_amount >= 0)
);

CREATE INDEX idx_income_streams_household ON income_streams(household_id);
CREATE INDEX idx_income_streams_person ON income_streams(person_id);
CREATE INDEX idx_income_streams_type ON income_streams(income_type);
CREATE INDEX idx_income_streams_dates ON income_streams(start_date, end_date);

-- Expense Streams
CREATE TABLE expense_streams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    expense_category_id UUID REFERENCES expense_categories(id),
    
    -- Stream details
    description VARCHAR(255) NOT NULL,
    
    -- Amount & frequency
    base_amount NUMERIC(20,2) NOT NULL,
    amount_frequency VARCHAR(20) NOT NULL,
    
    -- Inflation
    inflation_rate NUMERIC(5,4),  -- Override category default
    
    -- Discretionary
    is_discretionary BOOLEAN DEFAULT false,
    
    -- Tax
    tax_deductible BOOLEAN DEFAULT false,
    deduction_percentage NUMERIC(5,2),
    
    -- Timing
    start_date DATE NOT NULL,
    end_date DATE,
    
    -- Status
    active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT expense_streams_amount_frequency_check CHECK (
        amount_frequency IN ('weekly', 'bi_weekly', 'semi_monthly', 'monthly', 'quarterly', 'annual', 'one_time')
    ),
    CONSTRAINT expense_streams_amount_positive CHECK (base_amount >= 0)
);

CREATE INDEX idx_expense_streams_household ON expense_streams(household_id);
CREATE INDEX idx_expense_streams_category ON expense_streams(expense_category_id);
CREATE INDEX idx_expense_streams_dates ON expense_streams(start_date, end_date);

-- ============================================================================
-- D. GOALS & CONSTRAINTS
-- ============================================================================

-- Goals
CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    
    -- Goal details
    goal_type goal_type NOT NULL,
    goal_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Priority
    priority INTEGER DEFAULT 3,  -- 1 (highest) to 5 (lowest)
    
    -- Target
    target_amount NUMERIC(20,2),
    target_date DATE,
    
    -- Success metric
    success_metric VARCHAR(50) DEFAULT 'deterministic',  -- 'deterministic', 'probability_threshold'
    success_threshold NUMERIC(5,2),  -- Probability threshold (e.g., 85%)
    
    -- Status
    active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT goals_priority_check CHECK (priority BETWEEN 1 AND 5),
    CONSTRAINT goals_success_metric_check CHECK (
        success_metric IN ('deterministic', 'probability_threshold')
    )
);

CREATE INDEX idx_goals_household ON goals(household_id);
CREATE INDEX idx_goals_type ON goals(goal_type);
CREATE INDEX idx_goals_priority ON goals(priority);

-- Goal Cashflow Rules
CREATE TABLE goal_cashflow_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    
    -- Flow direction
    flow_type VARCHAR(10) NOT NULL,  -- 'inflow', 'outflow'
    
    -- Timing rule
    date_rule_type VARCHAR(50) NOT NULL,  -- 'fixed_date', 'age_based', 'schedule', 'event_triggered'
    date_rule_params JSONB,  -- { "person_id": "...", "age": 65, "schedule": ["2026-01", "2027-01"] }
    
    -- Amount rule
    amount_rule_type VARCHAR(50) NOT NULL,  -- 'fixed', 'inflation_adj', 'pct_income', 'pct_portfolio'
    amount_rule_params JSONB,  -- { "amount": 50000, "inflation": true, "percentage": 4 }
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT goal_cashflow_rules_flow_type_check CHECK (flow_type IN ('inflow', 'outflow'))
);

CREATE INDEX idx_goal_cashflow_rules_goal ON goal_cashflow_rules(goal_id);

-- Constraints
CREATE TABLE constraints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    
    -- Constraint details
    constraint_type constraint_type NOT NULL,
    description VARCHAR(255),
    
    -- Value
    value NUMERIC(20,2) NOT NULL,
    
    -- Timing
    effective_start DATE,
    effective_end DATE,
    
    -- Status
    active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_constraints_household ON constraints(household_id);
CREATE INDEX idx_constraints_type ON constraints(constraint_type);

-- ============================================================================
-- E. INSURANCE & RISK
-- ============================================================================

-- Insurance Policies
CREATE TABLE policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    
    -- Insured person
    insured_person_id UUID REFERENCES people(id) ON DELETE SET NULL,
    
    -- Policy details
    policy_type VARCHAR(50) NOT NULL,  -- 'life', 'disability', 'ltc', 'umbrella', 'property', 'health'
    carrier VARCHAR(100),
    policy_number_encrypted BYTEA,
    policy_number_masked VARCHAR(20),
    
    -- Coverage
    coverage_amount NUMERIC(20,2),
    premium_annual NUMERIC(20,2),
    
    -- Dates
    issue_date DATE,
    expiration_date DATE,
    
    -- Beneficiaries
    beneficiaries JSONB,  -- [{"person_id": "...", "percentage": 50}, ...]
    
    -- Status
    active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_policies_household ON policies(household_id);
CREATE INDEX idx_policies_insured ON policies(insured_person_id);
CREATE INDEX idx_policies_type ON policies(policy_type);

-- Risk Profiles
CREATE TABLE risk_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    person_id UUID REFERENCES people(id) ON DELETE SET NULL,
    
    -- Dual-dimension risk model
    risk_tolerance_score INTEGER,  -- Willingness (behavioral): 1-100
    risk_capacity_score INTEGER,   -- Ability (financial): 1-100
    
    -- Questionnaire
    questionnaire_version VARCHAR(20),
    questionnaire_responses JSONB,
    questionnaire_completed_at TIMESTAMPTZ,
    
    -- Derived allocation
    recommended_equity_pct NUMERIC(5,2),
    
    -- Validity
    effective_date DATE NOT NULL,
    expiration_date DATE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT risk_profiles_tolerance_check CHECK (
        risk_tolerance_score IS NULL OR (risk_tolerance_score BETWEEN 1 AND 100)
    ),
    CONSTRAINT risk_profiles_capacity_check CHECK (
        risk_capacity_score IS NULL OR (risk_capacity_score BETWEEN 1 AND 100)
    )
);

CREATE INDEX idx_risk_profiles_household ON risk_profiles(household_id);
CREATE INDEX idx_risk_profiles_person ON risk_profiles(person_id);

-- ============================================================================
-- Continued in 02-planning-schema.sql
-- ============================================================================
