-- ============================================================================
-- FARTHER PRISM - Financial Planning Platform
-- Seed Data (Part 4)
-- 
-- Version: 1.0.0
-- Date: 2026-02-23
-- 
-- Contains: Sample data for development and testing
-- - Federal tax rules (2024-2026)
-- - State tax rules (AZ, CA, NY)
-- - Default expense categories
-- - Sample return model
-- - Sample household
-- ============================================================================

-- ============================================================================
-- EXPENSE CATEGORIES
-- ============================================================================

INSERT INTO expense_categories (id, category_name, is_discretionary, default_inflation_rate, display_order) VALUES
-- Essential
(uuid_generate_v4(), 'Housing', false, 0.0300, 1),
(uuid_generate_v4(), 'Utilities', false, 0.0350, 2),
(uuid_generate_v4(), 'Groceries', false, 0.0400, 3),
(uuid_generate_v4(), 'Healthcare', false, 0.0500, 4),
(uuid_generate_v4(), 'Insurance', false, 0.0300, 5),
(uuid_generate_v4(), 'Transportation', false, 0.0350, 6),
(uuid_generate_v4(), 'Debt Payments', false, 0.0000, 7),

-- Discretionary
(uuid_generate_v4(), 'Dining & Entertainment', true, 0.0300, 10),
(uuid_generate_v4(), 'Travel', true, 0.0350, 11),
(uuid_generate_v4(), 'Hobbies', true, 0.0300, 12),
(uuid_generate_v4(), 'Gifts & Donations', true, 0.0250, 13),
(uuid_generate_v4(), 'Shopping', true, 0.0300, 14),
(uuid_generate_v4(), 'Personal Care', true, 0.0300, 15),
(uuid_generate_v4(), 'Education', false, 0.0500, 16),
(uuid_generate_v4(), 'Other', false, 0.0300, 20);

-- ============================================================================
-- FEDERAL TAX RULES 2024
-- ============================================================================

INSERT INTO tax_rule_sets (
    id,
    jurisdiction,
    tax_year,
    rules_json,
    effective_start,
    effective_end,
    version
) VALUES (
    uuid_generate_v4(),
    'federal',
    2024,
    '{
        "brackets": {
            "single": [
                {"min": 0, "max": 11600, "rate": 0.10},
                {"min": 11600, "max": 47150, "rate": 0.12},
                {"min": 47150, "max": 100525, "rate": 0.22},
                {"min": 100525, "max": 191950, "rate": 0.24},
                {"min": 191950, "max": 243725, "rate": 0.32},
                {"min": 243725, "max": 609350, "rate": 0.35},
                {"min": 609350, "max": null, "rate": 0.37}
            ],
            "married_joint": [
                {"min": 0, "max": 23200, "rate": 0.10},
                {"min": 23200, "max": 94300, "rate": 0.12},
                {"min": 94300, "max": 201050, "rate": 0.22},
                {"min": 201050, "max": 383900, "rate": 0.24},
                {"min": 383900, "max": 487450, "rate": 0.32},
                {"min": 487450, "max": 731200, "rate": 0.35},
                {"min": 731200, "max": null, "rate": 0.37}
            ],
            "married_separate": [
                {"min": 0, "max": 11600, "rate": 0.10},
                {"min": 11600, "max": 47150, "rate": 0.12},
                {"min": 47150, "max": 100525, "rate": 0.22},
                {"min": 100525, "max": 191950, "rate": 0.24},
                {"min": 191950, "max": 243725, "rate": 0.32},
                {"min": 243725, "max": 365600, "rate": 0.35},
                {"min": 365600, "max": null, "rate": 0.37}
            ],
            "head_of_household": [
                {"min": 0, "max": 16550, "rate": 0.10},
                {"min": 16550, "max": 63100, "rate": 0.12},
                {"min": 63100, "max": 100500, "rate": 0.22},
                {"min": 100500, "max": 191950, "rate": 0.24},
                {"min": 191950, "max": 243700, "rate": 0.32},
                {"min": 243700, "max": 609350, "rate": 0.35},
                {"min": 609350, "max": null, "rate": 0.37}
            ]
        },
        "standard_deduction": {
            "single": 14600,
            "married_joint": 29200,
            "married_separate": 14600,
            "head_of_household": 21900
        },
        "capital_gains_brackets": {
            "single": [
                {"min": 0, "max": 47025, "rate": 0.00},
                {"min": 47025, "max": 518900, "rate": 0.15},
                {"min": 518900, "max": null, "rate": 0.20}
            ],
            "married_joint": [
                {"min": 0, "max": 94050, "rate": 0.00},
                {"min": 94050, "max": 583750, "rate": 0.15},
                {"min": 583750, "max": null, "rate": 0.20}
            ],
            "married_separate": [
                {"min": 0, "max": 47025, "rate": 0.00},
                {"min": 47025, "max": 291850, "rate": 0.15},
                {"min": 291850, "max": null, "rate": 0.20}
            ],
            "head_of_household": [
                {"min": 0, "max": 63000, "rate": 0.00},
                {"min": 63000, "max": 551350, "rate": 0.15},
                {"min": 551350, "max": null, "rate": 0.20}
            ]
        },
        "niit_threshold": {
            "single": 200000,
            "married_joint": 250000,
            "married_separate": 125000,
            "head_of_household": 200000
        },
        "niit_rate": 0.038,
        "irmaa_thresholds": {
            "single": [
                {"min": 0, "max": 103000, "part_b_premium": 174.70, "part_d_premium": 0},
                {"min": 103000, "max": 129000, "part_b_premium": 244.60, "part_d_premium": 12.90},
                {"min": 129000, "max": 161000, "part_b_premium": 349.40, "part_d_premium": 33.30},
                {"min": 161000, "max": 193000, "part_b_premium": 454.20, "part_d_premium": 53.80},
                {"min": 193000, "max": 500000, "part_b_premium": 559.00, "part_d_premium": 74.20},
                {"min": 500000, "max": null, "part_b_premium": 594.00, "part_d_premium": 81.00}
            ],
            "married_joint": [
                {"min": 0, "max": 206000, "part_b_premium": 174.70, "part_d_premium": 0},
                {"min": 206000, "max": 258000, "part_b_premium": 244.60, "part_d_premium": 12.90},
                {"min": 258000, "max": 322000, "part_b_premium": 349.40, "part_d_premium": 33.30},
                {"min": 322000, "max": 386000, "part_b_premium": 454.20, "part_d_premium": 53.80},
                {"min": 386000, "max": 750000, "part_b_premium": 559.00, "part_d_premium": 74.20},
                {"min": 750000, "max": null, "part_b_premium": 594.00, "part_d_premium": 81.00}
            ]
        },
        "rmd_age_start": 73,
        "rmd_uniform_lifetime_table": {
            "73": 26.5, "74": 25.5, "75": 24.6, "76": 23.7, "77": 22.9,
            "78": 22.0, "79": 21.1, "80": 20.2, "81": 19.4, "82": 18.5,
            "83": 17.7, "84": 16.8, "85": 16.0, "86": 15.2, "87": 14.4,
            "88": 13.7, "89": 12.9, "90": 12.2, "91": 11.5, "92": 10.8,
            "93": 10.1, "94": 9.5, "95": 8.9, "96": 8.4, "97": 7.8,
            "98": 7.3, "99": 6.8, "100": 6.4
        },
        "qcd_max_annual": 105000,
        "qcd_age_eligible": 70.5,
        "social_security_taxation": {
            "threshold_1": {"single": 25000, "married_joint": 32000},
            "threshold_2": {"single": 34000, "married_joint": 44000}
        },
        "contribution_limits": {
            "401k": 23000,
            "401k_catchup": 7500,
            "401k_catchup_age": 50,
            "ira": 7000,
            "ira_catchup": 1000,
            "ira_catchup_age": 50,
            "hsa_individual": 4150,
            "hsa_family": 8300,
            "hsa_catchup": 1000,
            "hsa_catchup_age": 55
        }
    }'::jsonb,
    '2024-01-01',
    '2024-12-31',
    '1.0.0'
);

-- ============================================================================
-- STATE TAX RULES - ARIZONA 2024
-- ============================================================================

INSERT INTO tax_rule_sets (
    id,
    jurisdiction,
    tax_year,
    rules_json,
    effective_start,
    effective_end,
    version
) VALUES (
    uuid_generate_v4(),
    'AZ',
    2024,
    '{
        "flat_rate": 0.025,
        "standard_deduction": {
            "single": 13850,
            "married_joint": 27700,
            "married_separate": 13850,
            "head_of_household": 20800
        },
        "personal_exemption": {
            "taxpayer": 2300,
            "spouse": 2300,
            "dependent": 2400
        },
        "retirement_income_exemption": {
            "max": 2500,
            "age_requirement": 65
        },
        "social_security_exempt": true
    }'::jsonb,
    '2024-01-01',
    '2024-12-31',
    '1.0.0'
);

-- ============================================================================
-- STATE TAX RULES - CALIFORNIA 2024
-- ============================================================================

INSERT INTO tax_rule_sets (
    id,
    jurisdiction,
    tax_year,
    rules_json,
    effective_start,
    effective_end,
    version
) VALUES (
    uuid_generate_v4(),
    'CA',
    2024,
    '{
        "brackets": {
            "single": [
                {"min": 0, "max": 10412, "rate": 0.01},
                {"min": 10412, "max": 24684, "rate": 0.02},
                {"min": 24684, "max": 38959, "rate": 0.04},
                {"min": 38959, "max": 54081, "rate": 0.06},
                {"min": 54081, "max": 68350, "rate": 0.08},
                {"min": 68350, "max": 349137, "rate": 0.093},
                {"min": 349137, "max": 418961, "rate": 0.103},
                {"min": 418961, "max": 698271, "rate": 0.113},
                {"min": 698271, "max": null, "rate": 0.123}
            ],
            "married_joint": [
                {"min": 0, "max": 20824, "rate": 0.01},
                {"min": 20824, "max": 49368, "rate": 0.02},
                {"min": 49368, "max": 77918, "rate": 0.04},
                {"min": 77918, "max": 108162, "rate": 0.06},
                {"min": 108162, "max": 136700, "rate": 0.08},
                {"min": 136700, "max": 698274, "rate": 0.093},
                {"min": 698274, "max": 837922, "rate": 0.103},
                {"min": 837922, "max": 1396542, "rate": 0.113},
                {"min": 1396542, "max": null, "rate": 0.123}
            ]
        },
        "standard_deduction": {
            "single": 5363,
            "married_joint": 10726,
            "married_separate": 5363,
            "head_of_household": 10775
        },
        "sdi_rate": 0.009,
        "sdi_wage_base": 153164,
        "social_security_exempt": false
    }'::jsonb,
    '2024-01-01',
    '2024-12-31',
    '1.0.0'
);

-- ============================================================================
-- STATE TAX RULES - NEW YORK 2024
-- ============================================================================

INSERT INTO tax_rule_sets (
    id,
    jurisdiction,
    tax_year,
    rules_json,
    effective_start,
    effective_end,
    version
) VALUES (
    uuid_generate_v4(),
    'NY',
    2024,
    '{
        "brackets": {
            "single": [
                {"min": 0, "max": 8500, "rate": 0.04},
                {"min": 8500, "max": 11700, "rate": 0.045},
                {"min": 11700, "max": 13900, "rate": 0.0525},
                {"min": 13900, "max": 80650, "rate": 0.055},
                {"min": 80650, "max": 215400, "rate": 0.06},
                {"min": 215400, "max": 1077550, "rate": 0.0685},
                {"min": 1077550, "max": 5000000, "rate": 0.0965},
                {"min": 5000000, "max": 25000000, "rate": 0.103},
                {"min": 25000000, "max": null, "rate": 0.109}
            ],
            "married_joint": [
                {"min": 0, "max": 17150, "rate": 0.04},
                {"min": 17150, "max": 23600, "rate": 0.045},
                {"min": 23600, "max": 27900, "rate": 0.0525},
                {"min": 27900, "max": 161550, "rate": 0.055},
                {"min": 161550, "max": 323200, "rate": 0.06},
                {"min": 323200, "max": 2155350, "rate": 0.0685},
                {"min": 2155350, "max": 5000000, "rate": 0.0965},
                {"min": 5000000, "max": 25000000, "rate": 0.103},
                {"min": 25000000, "max": null, "rate": 0.109}
            ]
        },
        "standard_deduction": {
            "single": 8000,
            "married_joint": 16050,
            "married_separate": 8000,
            "head_of_household": 11200
        },
        "nyc_resident_tax": {
            "enabled": false,
            "note": "Set to true for NYC residents and include NYC brackets"
        },
        "social_security_exempt": true,
        "pension_exclusion": {
            "max": 20000,
            "age_requirement": 59.5
        }
    }'::jsonb,
    '2024-01-01',
    '2024-12-31',
    '1.0.0'
);

-- ============================================================================
-- DEFAULT RETURN MODEL (Conservative 2024)
-- ============================================================================

INSERT INTO return_models (
    id,
    model_name,
    description,
    expected_returns,
    covariance_matrix,
    effective_start,
    effective_end,
    version
) VALUES (
    uuid_generate_v4(),
    'Conservative 2024',
    'Conservative capital market assumptions for 2024-2030',
    '{
        "us_equity_large": 0.085,
        "us_equity_small": 0.095,
        "intl_equity_developed": 0.080,
        "intl_equity_emerging": 0.090,
        "fixed_income_core": 0.040,
        "fixed_income_high_yield": 0.055,
        "real_estate": 0.070,
        "commodities": 0.045,
        "cash": 0.030
    }'::jsonb,
    '{
        "rows": [
            "us_equity_large",
            "us_equity_small",
            "intl_equity_developed",
            "intl_equity_emerging",
            "fixed_income_core",
            "fixed_income_high_yield",
            "real_estate",
            "commodities",
            "cash"
        ],
        "matrix": [
            [0.0400, 0.0350, 0.0320, 0.0280, 0.0020, 0.0100, 0.0250, 0.0150, 0.0000],
            [0.0350, 0.0500, 0.0350, 0.0300, 0.0015, 0.0120, 0.0280, 0.0180, 0.0000],
            [0.0320, 0.0350, 0.0380, 0.0320, 0.0018, 0.0110, 0.0230, 0.0160, 0.0000],
            [0.0280, 0.0300, 0.0320, 0.0550, 0.0010, 0.0140, 0.0240, 0.0200, 0.0000],
            [0.0020, 0.0015, 0.0018, 0.0010, 0.0025, 0.0080, 0.0015, 0.0005, 0.0005],
            [0.0100, 0.0120, 0.0110, 0.0140, 0.0080, 0.0180, 0.0120, 0.0090, 0.0003],
            [0.0250, 0.0280, 0.0230, 0.0240, 0.0015, 0.0120, 0.0350, 0.0180, 0.0002],
            [0.0150, 0.0180, 0.0160, 0.0200, 0.0005, 0.0090, 0.0180, 0.0300, 0.0001],
            [0.0000, 0.0000, 0.0000, 0.0000, 0.0005, 0.0003, 0.0002, 0.0001, 0.0001]
        ]
    }'::jsonb,
    '2024-01-01',
    '2030-12-31',
    '1.0.0'
);

-- ============================================================================
-- SAMPLE HOUSEHOLD (For Testing)
-- ============================================================================

DO $$
DECLARE
    household_id UUID := uuid_generate_v4();
    person_john_id UUID := uuid_generate_v4();
    person_jane_id UUID := uuid_generate_v4();
    account_taxable_id UUID := uuid_generate_v4();
    account_ira_john_id UUID := uuid_generate_v4();
    account_ira_jane_id UUID := uuid_generate_v4();
    account_roth_john_id UUID := uuid_generate_v4();
    security_vti_id UUID := uuid_generate_v4();
    security_vxus_id UUID := uuid_generate_v4();
    security_bnd_id UUID := uuid_generate_v4();
BEGIN
    -- Household
    INSERT INTO households (id, name, status) VALUES
    (household_id, 'Smith Family (Sample)', 'active');

    -- People
    INSERT INTO people (id, household_id, first_name, last_name, dob, ssn_last4, state_residence, is_primary) VALUES
    (person_john_id, household_id, 'John', 'Smith', '1975-06-15', '1234', 'AZ', true),
    (person_jane_id, household_id, 'Jane', 'Smith', '1977-08-22', '5678', 'AZ', false);

    -- Relationship
    INSERT INTO relationships (household_id, person_id, related_person_id, relationship_type) VALUES
    (household_id, person_john_id, person_jane_id, 'spouse');

    -- Securities
    INSERT INTO security_master (id, symbol, name, security_type, asset_class) VALUES
    (security_vti_id, 'VTI', 'Vanguard Total Stock Market ETF', 'etf', 'us_equity_large'),
    (security_vxus_id, 'VXUS', 'Vanguard Total International Stock ETF', 'etf', 'intl_equity_developed'),
    (security_bnd_id, 'BND', 'Vanguard Total Bond Market ETF', 'etf', 'fixed_income_core');

    -- Accounts
    INSERT INTO accounts (id, household_id, account_type, account_name, custodian, tax_treatment, status) VALUES
    (account_taxable_id, household_id, 'taxable', 'Joint Taxable', 'Schwab', 'taxable', 'active'),
    (account_ira_john_id, household_id, 'ira_traditional', 'John Traditional IRA', 'Schwab', 'deferred', 'active'),
    (account_ira_jane_id, household_id, 'ira_traditional', 'Jane Traditional IRA', 'Schwab', 'deferred', 'active'),
    (account_roth_john_id, household_id, 'ira_roth', 'John Roth IRA', 'Schwab', 'free', 'active');

    -- Ownership
    INSERT INTO ownership (household_id, owner_person_id, owned_account_id, ownership_percentage) VALUES
    (household_id, person_john_id, account_taxable_id, 50),
    (household_id, person_jane_id, account_taxable_id, 50),
    (household_id, person_john_id, account_ira_john_id, 100),
    (household_id, person_jane_id, account_ira_jane_id, 100),
    (household_id, person_john_id, account_roth_john_id, 100);

    -- Positions (current holdings)
    INSERT INTO positions (account_id, security_id, quantity, price, market_value, cost_basis_total, as_of_date) VALUES
    -- Taxable account (60/30/10)
    (account_taxable_id, security_vti_id, 1200, 250.00, 300000, 240000, CURRENT_DATE),
    (account_taxable_id, security_vxus_id, 2500, 60.00, 150000, 140000, CURRENT_DATE),
    (account_taxable_id, security_bnd_id, 600, 83.33, 50000, 50000, CURRENT_DATE),
    
    -- John's IRA (70/30)
    (account_ira_john_id, security_vti_id, 1400, 250.00, 350000, 300000, CURRENT_DATE),
    (account_ira_john_id, security_bnd_id, 1800, 83.33, 150000, 150000, CURRENT_DATE),
    
    -- Jane's IRA (70/30)
    (account_ira_jane_id, security_vti_id, 800, 250.00, 200000, 180000, CURRENT_DATE),
    (account_ira_jane_id, security_bnd_id, 1200, 83.33, 100000, 100000, CURRENT_DATE),
    
    -- John's Roth (100% equity)
    (account_roth_john_id, security_vti_id, 400, 250.00, 100000, 80000, CURRENT_DATE);

    -- Income Streams
    INSERT INTO income_streams (household_id, person_id, income_type, description, base_amount, amount_frequency, growth_rate, start_date) VALUES
    (household_id, person_john_id, 'w2_salary', 'John Salary', 150000, 'annual', 0.03, '2020-01-01'),
    (household_id, person_jane_id, 'w2_salary', 'Jane Salary', 120000, 'annual', 0.03, '2020-01-01');

    -- Expense Streams
    INSERT INTO expense_streams (household_id, description, base_amount, amount_frequency, is_discretionary, start_date) VALUES
    (household_id, 'Mortgage', 3500, 'monthly', false, '2015-01-01'),
    (household_id, 'Utilities', 400, 'monthly', false, '2015-01-01'),
    (household_id, 'Groceries', 1200, 'monthly', false, '2015-01-01'),
    (household_id, 'Insurance', 800, 'monthly', false, '2015-01-01'),
    (household_id, 'Travel & Entertainment', 1500, 'monthly', true, '2015-01-01');

    -- Goals
    INSERT INTO goals (household_id, goal_type, goal_name, target_amount, target_date, priority) VALUES
    (household_id, 'retirement', 'Retirement at 65', 3000000, '2040-06-15', 1),
    (household_id, 'legacy', 'Estate for Children', 1000000, NULL, 3);

    RAISE NOTICE 'Sample household created: %', household_id;
END $$;

-- ============================================================================
-- SEED DATA COMPLETE
-- ============================================================================

SELECT 'Seed data loaded successfully.' AS status;
