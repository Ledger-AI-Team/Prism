-- ============================================================================
-- FARTHER PRISM - Financial Planning Platform
-- Views, Functions & Triggers (Part 3)
-- 
-- Version: 1.0.0
-- Date: 2026-02-23
-- ============================================================================

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Household Summary View
CREATE OR REPLACE VIEW v_household_summary AS
SELECT 
    h.id AS household_id,
    h.name AS household_name,
    h.status,
    COUNT(DISTINCT p.id) AS num_people,
    COUNT(DISTINCT e.id) AS num_entities,
    COUNT(DISTINCT a.id) AS num_accounts,
    COALESCE(SUM(pos.market_value), 0) AS total_portfolio_value,
    MAX(pos.as_of_date) AS portfolio_as_of_date,
    COUNT(DISTINCT pl.id) AS num_plans,
    h.created_at,
    h.updated_at
FROM households h
LEFT JOIN people p ON h.id = p.household_id AND p.status = 'active'
LEFT JOIN entities e ON h.id = e.household_id
LEFT JOIN accounts a ON h.id = a.household_id AND a.status = 'active'
LEFT JOIN LATERAL (
    SELECT account_id, SUM(market_value) AS market_value, MAX(as_of_date) AS as_of_date
    FROM positions
    WHERE account_id = a.id
    GROUP BY account_id
) pos ON a.id = pos.account_id
LEFT JOIN plans pl ON h.id = pl.household_id AND pl.status != 'archived'
GROUP BY h.id, h.name, h.status, h.created_at, h.updated_at;

COMMENT ON VIEW v_household_summary IS 'Aggregated household metrics for dashboard views';

-- Account Holdings View (current positions)
CREATE OR REPLACE VIEW v_account_holdings AS
SELECT 
    a.id AS account_id,
    a.household_id,
    a.account_name,
    a.account_type,
    a.tax_treatment,
    a.custodian,
    pos.security_id,
    sm.symbol,
    sm.name AS security_name,
    sm.asset_class,
    pos.quantity,
    pos.price,
    pos.market_value,
    pos.cost_basis_total,
    pos.unrealized_gain_loss,
    CASE 
        WHEN pos.cost_basis_total > 0 
        THEN (pos.market_value - pos.cost_basis_total) / pos.cost_basis_total 
        ELSE NULL 
    END AS return_pct,
    pos.as_of_date
FROM accounts a
JOIN positions pos ON a.id = pos.account_id
JOIN security_master sm ON pos.security_id = sm.id
WHERE a.status = 'active'
    AND pos.id IN (
        SELECT DISTINCT ON (account_id, security_id) id
        FROM positions
        ORDER BY account_id, security_id, as_of_date DESC
    );

COMMENT ON VIEW v_account_holdings IS 'Current positions across all accounts with unrealized gains';

-- Portfolio Allocation View
CREATE OR REPLACE VIEW v_portfolio_allocation AS
SELECT 
    a.household_id,
    sm.asset_class,
    SUM(pos.market_value) AS market_value,
    SUM(pos.market_value) / NULLIF(household_totals.total, 0) AS allocation_pct
FROM accounts a
JOIN positions pos ON a.id = pos.account_id
JOIN security_master sm ON pos.security_id = sm.id
JOIN LATERAL (
    SELECT household_id, SUM(market_value) AS total
    FROM accounts a2
    JOIN positions pos2 ON a2.id = pos2.account_id
    WHERE a2.household_id = a.household_id
        AND a2.status = 'active'
        AND pos2.id IN (
            SELECT DISTINCT ON (account_id, security_id) id
            FROM positions
            ORDER BY account_id, security_id, as_of_date DESC
        )
    GROUP BY household_id
) household_totals ON a.household_id = household_totals.household_id
WHERE a.status = 'active'
    AND pos.id IN (
        SELECT DISTINCT ON (account_id, security_id) id
        FROM positions
        ORDER BY account_id, security_id, as_of_date DESC
    )
GROUP BY a.household_id, sm.asset_class, household_totals.total;

COMMENT ON VIEW v_portfolio_allocation IS 'Current asset allocation by household';

-- Tax Lot Summary View
CREATE OR REPLACE VIEW v_tax_lot_summary AS
SELECT 
    l.account_id,
    l.security_id,
    sm.symbol,
    sm.name AS security_name,
    COUNT(*) AS num_lots,
    SUM(l.quantity) AS total_quantity,
    SUM(l.cost_basis_total) AS total_cost_basis,
    SUM(l.quantity * pos.price) AS market_value,
    SUM(l.quantity * pos.price) - SUM(l.cost_basis_total) AS unrealized_gain_loss,
    SUM(CASE WHEN l.term = 'long' THEN l.quantity * pos.price ELSE 0 END) AS market_value_long_term,
    SUM(CASE WHEN l.term = 'short' THEN l.quantity * pos.price ELSE 0 END) AS market_value_short_term,
    MIN(l.acquire_date) AS earliest_acquire_date,
    MAX(l.acquire_date) AS latest_acquire_date
FROM lots l
JOIN security_master sm ON l.security_id = sm.id
JOIN LATERAL (
    SELECT price
    FROM positions
    WHERE account_id = l.account_id
        AND security_id = l.security_id
    ORDER BY as_of_date DESC
    LIMIT 1
) pos ON true
WHERE l.disposed_date IS NULL
GROUP BY l.account_id, l.security_id, sm.symbol, sm.name;

COMMENT ON VIEW v_tax_lot_summary IS 'Tax lot summary with long-term vs short-term breakdown';

-- Income & Expense Projection View
CREATE OR REPLACE VIEW v_cashflow_summary AS
WITH income_annual AS (
    SELECT 
        household_id,
        SUM(
            CASE 
                WHEN amount_frequency = 'annual' THEN base_amount
                WHEN amount_frequency = 'monthly' THEN base_amount * 12
                WHEN amount_frequency = 'quarterly' THEN base_amount * 4
                WHEN amount_frequency = 'bi_weekly' THEN base_amount * 26
                WHEN amount_frequency = 'weekly' THEN base_amount * 52
                ELSE 0
            END
        ) AS annual_income
    FROM income_streams
    WHERE active = true
        AND start_date <= CURRENT_DATE
        AND (end_date IS NULL OR end_date >= CURRENT_DATE)
),
expense_annual AS (
    SELECT 
        household_id,
        SUM(
            CASE 
                WHEN amount_frequency = 'annual' THEN base_amount
                WHEN amount_frequency = 'monthly' THEN base_amount * 12
                WHEN amount_frequency = 'quarterly' THEN base_amount * 4
                WHEN amount_frequency = 'bi_weekly' THEN base_amount * 26
                WHEN amount_frequency = 'weekly' THEN base_amount * 52
                ELSE 0
            END
        ) AS annual_expenses,
        SUM(
            CASE 
                WHEN is_discretionary THEN
                    CASE 
                        WHEN amount_frequency = 'annual' THEN base_amount
                        WHEN amount_frequency = 'monthly' THEN base_amount * 12
                        ELSE 0
                    END
                ELSE 0
            END
        ) AS discretionary_expenses
    FROM expense_streams
    WHERE active = true
        AND start_date <= CURRENT_DATE
        AND (end_date IS NULL OR end_date >= CURRENT_DATE)
)
SELECT 
    h.id AS household_id,
    h.name AS household_name,
    COALESCE(i.annual_income, 0) AS annual_income,
    COALESCE(e.annual_expenses, 0) AS annual_expenses,
    COALESCE(e.discretionary_expenses, 0) AS discretionary_expenses,
    COALESCE(i.annual_income, 0) - COALESCE(e.annual_expenses, 0) AS annual_net_cashflow,
    CASE 
        WHEN COALESCE(e.annual_expenses, 0) > 0 
        THEN (COALESCE(i.annual_income, 0) - COALESCE(e.annual_expenses, 0)) / COALESCE(e.annual_expenses, 0)
        ELSE NULL
    END AS savings_rate
FROM households h
LEFT JOIN income_annual i ON h.id = i.household_id
LEFT JOIN expense_annual e ON h.id = e.household_id
WHERE h.status = 'active';

COMMENT ON VIEW v_cashflow_summary IS 'Current annual income, expenses, and savings rate by household';

-- Plan Run Status View
CREATE OR REPLACE VIEW v_plan_run_status AS
SELECT 
    pr.id AS run_id,
    pr.run_type,
    pr.run_status,
    pr.progress_percentage,
    s.scenario_name,
    pl.plan_name,
    h.household_id,
    h.name AS household_name,
    pr.horizon_years,
    pr.num_simulations,
    pr.success_probability,
    pr.median_terminal_wealth,
    pr.queued_at,
    pr.started_at,
    pr.completed_at,
    EXTRACT(EPOCH FROM (COALESCE(pr.completed_at, NOW()) - pr.started_at)) AS duration_seconds,
    pr.error_message,
    pr.engine_version
FROM plan_runs pr
JOIN scenarios s ON pr.scenario_id = s.id
JOIN plans pl ON s.plan_id = pl.id
JOIN households h ON pl.household_id = h.id;

COMMENT ON VIEW v_plan_run_status IS 'Plan run execution status with household context';

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically update updated_at timestamp on row modification';

-- Function: Audit log trigger
CREATE OR REPLACE FUNCTION audit_log_trigger()
RETURNS TRIGGER AS $$
DECLARE
    old_data JSONB;
    new_data JSONB;
    action_type TEXT;
BEGIN
    -- Determine action type
    IF (TG_OP = 'INSERT') THEN
        action_type := 'create';
        old_data := NULL;
        new_data := to_jsonb(NEW);
    ELSIF (TG_OP = 'UPDATE') THEN
        action_type := 'update';
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
    ELSIF (TG_OP = 'DELETE') THEN
        action_type := 'delete';
        old_data := to_jsonb(OLD);
        new_data := NULL;
    END IF;

    -- Insert audit record
    INSERT INTO audit_log (
        user_id,
        user_email,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values,
        timestamp
    ) VALUES (
        COALESCE(current_setting('app.current_user_id', true)::UUID, NULL),
        current_setting('app.current_user_email', true),
        action_type,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        old_data,
        new_data,
        NOW()
    );

    -- Return appropriate value
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION audit_log_trigger() IS 'Capture all mutations to audited tables';

-- Function: Calculate age from DOB
CREATE OR REPLACE FUNCTION calculate_age(dob DATE, as_of_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN DATE_PART('year', AGE(as_of_date, dob));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_age(DATE, DATE) IS 'Calculate age in years from date of birth';

-- Function: Get household portfolio value
CREATE OR REPLACE FUNCTION get_household_portfolio_value(
    household_id_param UUID,
    as_of_date_param DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC AS $$
DECLARE
    total_value NUMERIC;
BEGIN
    SELECT COALESCE(SUM(p.market_value), 0)
    INTO total_value
    FROM accounts a
    JOIN positions p ON a.id = p.account_id
    WHERE a.household_id = household_id_param
        AND a.status = 'active'
        AND p.as_of_date <= as_of_date_param
        AND p.id IN (
            SELECT DISTINCT ON (account_id, security_id) id
            FROM positions
            WHERE as_of_date <= as_of_date_param
            ORDER BY account_id, security_id, as_of_date DESC
        );
    
    RETURN total_value;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_household_portfolio_value(UUID, DATE) IS 'Calculate total portfolio value for a household as of a specific date';

-- Function: Get account balance by tax treatment
CREATE OR REPLACE FUNCTION get_account_balance_by_tax_treatment(
    household_id_param UUID,
    tax_treatment_param VARCHAR,
    as_of_date_param DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC AS $$
DECLARE
    total_value NUMERIC;
BEGIN
    SELECT COALESCE(SUM(p.market_value), 0)
    INTO total_value
    FROM accounts a
    JOIN positions p ON a.id = p.account_id
    WHERE a.household_id = household_id_param
        AND a.tax_treatment = tax_treatment_param
        AND a.status = 'active'
        AND p.as_of_date <= as_of_date_param
        AND p.id IN (
            SELECT DISTINCT ON (account_id, security_id) id
            FROM positions
            WHERE as_of_date <= as_of_date_param
            ORDER BY account_id, security_id, as_of_date DESC
        );
    
    RETURN total_value;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_account_balance_by_tax_treatment(UUID, VARCHAR, DATE) IS 'Calculate total balance by tax treatment (taxable/deferred/free)';

-- Function: Generate assumption set version hash
CREATE OR REPLACE FUNCTION generate_assumption_set_hash(assumption_set_row assumption_sets)
RETURNS VARCHAR AS $$
DECLARE
    hash_input TEXT;
BEGIN
    -- Concatenate all inputs for hashing
    hash_input := 
        COALESCE(assumption_set_row.valuation_as_of_date::TEXT, '') || '|' ||
        COALESCE(assumption_set_row.inflation_cpi::TEXT, '') || '|' ||
        COALESCE(assumption_set_row.healthcare_inflation::TEXT, '') || '|' ||
        COALESCE(assumption_set_row.return_model_id::TEXT, '') || '|' ||
        COALESCE(assumption_set_row.tax_rule_set_federal_id::TEXT, '') || '|' ||
        COALESCE(assumption_set_row.tax_rule_set_state_id::TEXT, '');
    
    -- Return SHA256 hash
    RETURN ENCODE(DIGEST(hash_input, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION generate_assumption_set_hash(assumption_sets) IS 'Generate reproducible hash for assumption set caching';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated_at triggers for all mutable tables
CREATE TRIGGER update_households_updated_at BEFORE UPDATE ON households
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_people_updated_at BEFORE UPDATE ON people
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entities_updated_at BEFORE UPDATE ON entities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_relationships_updated_at BEFORE UPDATE ON relationships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ownership_updated_at BEFORE UPDATE ON ownership
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_master_updated_at BEFORE UPDATE ON security_master
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lots_updated_at BEFORE UPDATE ON lots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cash_movements_updated_at BEFORE UPDATE ON cash_movements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_categories_updated_at BEFORE UPDATE ON expense_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_income_streams_updated_at BEFORE UPDATE ON income_streams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_streams_updated_at BEFORE UPDATE ON expense_streams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goal_cashflow_rules_updated_at BEFORE UPDATE ON goal_cashflow_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_constraints_updated_at BEFORE UPDATE ON constraints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_policies_updated_at BEFORE UPDATE ON policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_risk_profiles_updated_at BEFORE UPDATE ON risk_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_profiles_updated_at BEFORE UPDATE ON tax_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_rule_sets_updated_at BEFORE UPDATE ON tax_rule_sets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scenarios_updated_at BEFORE UPDATE ON scenarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_return_models_updated_at BEFORE UPDATE ON return_models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assumption_sets_updated_at BEFORE UPDATE ON assumption_sets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plan_runs_updated_at BEFORE UPDATE ON plan_runs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recommendations_updated_at BEFORE UPDATE ON recommendations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_external_links_updated_at BEFORE UPDATE ON external_links
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit triggers for critical tables
CREATE TRIGGER audit_households AFTER INSERT OR UPDATE OR DELETE ON households
    FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_people AFTER INSERT OR UPDATE OR DELETE ON people
    FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_accounts AFTER INSERT OR UPDATE OR DELETE ON accounts
    FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_plans AFTER INSERT OR UPDATE OR DELETE ON plans
    FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_plan_runs AFTER INSERT OR UPDATE OR DELETE ON plan_runs
    FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_recommendations AFTER INSERT OR UPDATE OR DELETE ON recommendations
    FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

-- ============================================================================
-- COMMENTS & DOCUMENTATION
-- ============================================================================

COMMENT ON DATABASE CURRENT IS 'Farther Prism - Institutional-grade financial planning platform';

COMMENT ON TABLE households IS 'Root node of household graph; primary planning unit';
COMMENT ON TABLE people IS 'Individuals within households (clients, dependents, beneficiaries)';
COMMENT ON TABLE entities IS 'Legal entities (trusts, LLCs, foundations) owned by households';
COMMENT ON TABLE relationships IS 'Relationships between people (spouse, child, dependent, etc.)';
COMMENT ON TABLE ownership IS 'Generic ownership graph (who owns what)';

COMMENT ON TABLE accounts IS 'Financial accounts (taxable, IRA, 401k, etc.)';
COMMENT ON TABLE security_master IS 'Reference data for securities (stocks, bonds, funds)';
COMMENT ON TABLE positions IS 'Holdings within accounts (time-series snapshots)';
COMMENT ON TABLE lots IS 'Tax lot tracking for taxable accounts (cost basis, term)';
COMMENT ON TABLE cash_movements IS 'Deposits, withdrawals, dividends, RMDs, fees';

COMMENT ON TABLE income_streams IS 'Recurring income (W2, pension, SS, rental, etc.)';
COMMENT ON TABLE expense_streams IS 'Recurring expenses with inflation adjustment';
COMMENT ON TABLE expense_categories IS 'Hierarchical expense categorization';

COMMENT ON TABLE goals IS 'Financial goals (retirement, education, legacy, etc.)';
COMMENT ON TABLE goal_cashflow_rules IS 'Rules for goal-driven cash flows';
COMMENT ON TABLE constraints IS 'Planning constraints (min cash, max bracket, IRMAA limits)';

COMMENT ON TABLE policies IS 'Insurance policies (life, disability, LTC, umbrella)';
COMMENT ON TABLE risk_profiles IS 'Dual-dimension risk model (tolerance vs capacity)';

COMMENT ON TABLE tax_profiles IS 'Household tax filing information (status, state, deductions)';
COMMENT ON TABLE tax_rule_sets IS 'Versioned tax rules by jurisdiction and year';

COMMENT ON TABLE plans IS 'Top-level plan container (1+ scenarios per plan)';
COMMENT ON TABLE scenarios IS 'Plan variations (Base, Conservative, Aggressive, etc.)';
COMMENT ON TABLE return_models IS 'Capital Market Assumptions (expected returns + covariance)';
COMMENT ON TABLE assumption_sets IS 'Immutable snapshot of all planning assumptions';

COMMENT ON TABLE plan_runs IS 'Execution records (deterministic, Monte Carlo, optimization)';
COMMENT ON TABLE projection_timeseries IS 'Materialized projection output (portfolio, income, taxes, etc.)';
COMMENT ON TABLE mc_distribution_summaries IS 'Monte Carlo distribution statistics (percentiles, success probability)';
COMMENT ON TABLE recommendations IS 'AI-generated opportunities (tax, retirement, insurance, etc.)';

COMMENT ON TABLE external_links IS 'Integrations with CRM, custodians, aggregators';
COMMENT ON TABLE audit_log IS 'Immutable audit trail (who, what, when)';

-- ============================================================================
-- PERFORMANCE INDEXES (Additional)
-- ============================================================================

-- Composite indexes for common query patterns
CREATE INDEX idx_positions_account_date_security ON positions(account_id, as_of_date DESC, security_id);
CREATE INDEX idx_cash_movements_account_date_type ON cash_movements(account_id, movement_date DESC, movement_type);
CREATE INDEX idx_income_streams_household_dates ON income_streams(household_id, start_date, end_date) WHERE active = true;
CREATE INDEX idx_expense_streams_household_dates ON expense_streams(household_id, start_date, end_date) WHERE active = true;

-- GIN indexes for JSONB columns (fast JSON queries)
CREATE INDEX idx_return_models_expected_returns_gin ON return_models USING GIN (expected_returns);
CREATE INDEX idx_return_models_covariance_gin ON return_models USING GIN (covariance_matrix);
CREATE INDEX idx_tax_rule_sets_rules_gin ON tax_rule_sets USING GIN (rules_json);
CREATE INDEX idx_assumption_sets_scenario_hash ON assumption_sets(scenario_id, version_hash);
CREATE INDEX idx_recommendations_impact_gin ON recommendations USING GIN (impact_estimate);

-- Partial indexes for common filters
CREATE INDEX idx_accounts_active ON accounts(household_id, account_type) WHERE status = 'active';
CREATE INDEX idx_people_active ON people(household_id) WHERE status = 'active' AND dod IS NULL;
CREATE INDEX idx_plan_runs_complete ON plan_runs(scenario_id, completed_at DESC) WHERE run_status = 'complete';
CREATE INDEX idx_plan_runs_queued ON plan_runs(queued_at) WHERE run_status = 'queued';
CREATE INDEX idx_recommendations_pending ON recommendations(plan_run_id, priority) WHERE approval_status = 'pending';

-- ============================================================================
-- GRANTS (Basic - expand based on role structure)
-- ============================================================================

-- Create roles (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'prism_api') THEN
        CREATE ROLE prism_api WITH LOGIN;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'prism_readonly') THEN
        CREATE ROLE prism_readonly WITH LOGIN;
    END IF;
END
$$;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO prism_api, prism_readonly;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO prism_api;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO prism_readonly;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO prism_api;

-- Grant execution on functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO prism_api, prism_readonly;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO prism_api;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO prism_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO prism_api;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO prism_api, prism_readonly;

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================

-- Verify table count
SELECT 'Schema deployment complete. Table count: ' || COUNT(*)::TEXT AS status
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';
