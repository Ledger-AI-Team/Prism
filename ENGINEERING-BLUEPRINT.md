# Financial Planning Software - Engineering Blueprint
*Source: Tim's Document - Feb 23, 2026*

---

## 1. Core Entities & Relationships

### Household Graph
```
Household (root)
  ├─ People
  │   ├─ person_id, name, dob, ssn_last4
  │   ├─ citizenship, state_residence
  │   └─ health_rating, smoker_flag
  ├─ Entities (Trusts, LLCs, Foundations)
  │   ├─ entity_type (rev_trust, irrev_trust, llc, etc.)
  │   └─ tax_id, state_of_formation
  ├─ Relationships (spouse, child, dependent)
  └─ Ownership (who owns what, with percentages)
```

### Accounts & Positions
```
Account
  ├─ account_type (taxable, ira, roth, 401k, 529, etc.)
  ├─ tax_treatment (derived: taxable/deferred/free)
  ├─ custodian, account_number_masked
  └─ data_source (manual, feed, aggregator)
  
Position (holdings within account)
  ├─ security_id → Security Master
  ├─ quantity, price, market_value
  ├─ cost_basis_total
  └─ as_of_datetime
  
Lot (for taxable accounts)
  ├─ acquire_date, cost_basis
  ├─ wash_sale_flag
  └─ term (short/long derived)
```

### Income & Expenses
```
Income Stream
  ├─ income_type (w2, 1099, pension, ss, rental, k1)
  ├─ start_date, end_date
  ├─ amount_frequency (monthly, annual, quarterly)
  ├─ base_amount, growth_rate
  └─ tax_character (ordinary, qualified_div, cap_gain)
  
Expense Stream
  ├─ expense_category → Category (housing, healthcare, etc.)
  ├─ base_amount, inflation_override
  ├─ is_discretionary
  └─ tax_deductible_flag
```

### Goals & Constraints
```
Goal
  ├─ goal_type (retirement, education, legacy, etc.)
  ├─ priority (1-5)
  ├─ target_amount
  └─ success_metric (probability_threshold, deterministic)
  
Goal Cashflow Rule
  ├─ flow_type (inflow/outflow)
  ├─ date_rule (fixed, age_based, schedule)
  └─ amount_rule (fixed, inflation_adj, % income, % portfolio)
  
Constraint
  ├─ constraint_type (min_cash, max_bracket, max_irmaa, etc.)
  └─ value, effective_start, effective_end
```

### Versioning & Assumptions
```
Plan (top level)
  └─ Scenario (Base, Conservative, Aggressive)
      └─ Assumption Set (immutable snapshot)
          ├─ valuation_as_of_date
          ├─ inflation_cpi, healthcare_inflation
          ├─ return_model_id → Return Model
          ├─ tax_rule_set_id → Tax Rule Set
          └─ version_hash (reproducibility)
          
Return Model (CMAs)
  ├─ expected_returns_json (by asset class)
  ├─ covariance_matrix_json
  └─ fat_tail_params (optional)
  
Tax Rule Set (versioned by year)
  ├─ jurisdiction (federal/state)
  ├─ tax_year
  └─ payload_json (brackets, IRMAA, NIIT, etc.)
```

### Plan Run Outputs
```
Plan Run
  ├─ scenario_id, assumption_set_id
  ├─ run_type (deterministic, monte_carlo, optimization)
  ├─ run_status, timestamps
  └─ engine_version, seed (MC reproducibility)
  
Projection Timeseries (materialized)
  ├─ dimension (portfolio_value, taxes, spending, etc.)
  ├─ time_period (YYYY-MM)
  ├─ value
  └─ percentile (10/50/90 for MC)
  
MC Distribution Summary
  ├─ success_probability
  ├─ median/p10/p90 terminal_wealth
  └─ max_drawdown
  
Recommendation (AI-generated)
  ├─ category (tax, retirement, insurance, etc.)
  ├─ title, description
  ├─ impact_estimate_json
  ├─ confidence_score
  └─ requires_advisor_approval
```

---

## 2. Services Architecture

### Service Breakdown

**1. Data Ingestion Service**
- Pulls custodial/aggregated data
- Normalizes into account/position/cash_movement
- Maintains provenance tracking
- Handles: Plaid, Orion, Schwab, Fidelity APIs

**2. Planning Graph Service**
- Household CRUD operations
- Person/entity/relationship management
- Ownership graph maintenance
- Referential integrity enforcement

**3. Assumptions Service**
- Creates versioned assumption_set
- Locks tax_rule_set + return_model
- Version hashing for reproducibility
- Admin interface for CMAs

**4. Calculation Engine** (Core)
- Deterministic monthly projections
- Tax calculation (federal + state + IRMAA + NIIT)
- Withdrawal sequencing with fixed-point solve
- Goal funding logic
- Performance target: <2s for 30-year run

**5. Monte Carlo Engine**
- Stochastic return generation
- Parallel path simulation
- Percentile aggregation
- Target: <10s for 2,000 paths

**6. Optimization Engine** (v2)
- Roth conversion timing
- Withdrawal strategy optimization
- Goal funding allocation
- Tax bracket filling
- Constrained nonlinear optimization

**7. Recommendations Engine**
- Rule-based opportunity detection
- Impact quantification
- Confidence scoring
- Approval workflow

**8. Reporting/Export Service**
- Client PDFs (branded)
- Compliance snapshots
- Plan change logs
- Scenario comparisons

---

## 3. Calculation Engine Implementation

### Time Model
- **Internal:** Monthly steps (t = 1..T months)
- **Display:** Annual aggregation
- **Conversion:** `rate_monthly = (1 + rate_annual)^(1/12) - 1`

### Monthly Projection Loop

```
For each month t in planning horizon:

1. INCOME CALCULATION
   For each income_stream:
     amount(t) = base * (1 + growth)^years_elapsed
   Total_Income(t) = Σ all streams

2. EXPENSE CALCULATION  
   For each expense_stream:
     amount(t) = base * (1 + inflation)^years_elapsed
   Total_Expenses(t) = Σ all streams

3. PORTFOLIO RETURNS
   For each account:
     pre_flow_value(t) = balance(t-1) * (1 + monthly_return)

4. TAX CALCULATION (iterative)
   LOOP until convergence:
     a) Propose withdrawals to cover shortfall
     b) Compute taxable income from all sources
     c) Calculate taxes (federal + state + IRMAA + NIIT)
     d) Recompute shortfall including taxes
     e) Adjust withdrawals
   END LOOP
   
5. WITHDRAWAL SEQUENCING
   Priority order:
     - Taxable accounts (cap gains treatment)
     - Tax-deferred (ordinary income)
     - Roth (tax-free, preserve for last)
   
   Apply RMD requirements (age 72+)
   Apply goal-specific withdrawals

6. GOAL FUNDING
   For each active goal:
     Apply goal_cashflow_rules
     Track funding progress

7. ACCOUNT UPDATES
   For each account:
     balance(t) = pre_flow_value(t) + inflows(t) - outflows(t)
   
   Total_Portfolio(t) = Σ all accounts

8. CONSTRAINT CHECKS
   Verify: min_cash, max_bracket, IRMAA limits, etc.
   Flag violations for recommendations
```

### Tax Calculation Detail

**Federal Tax:**
```
1. Ordinary Income
   - Wages, interest, non-qualified dividends
   - IRA/401k withdrawals
   - Roth conversions
   - RMDs

2. Preferential Income
   - Qualified dividends (0/15/20%)
   - Long-term capital gains (0/15/20%)

3. Adjustments
   - Standard/itemized deductions
   - QCD (if age 70.5+)

4. Calculate Tax
   - Apply bracket schedule from tax_rule_set
   - AMT check (if applicable)
   
5. Additional Taxes
   - NIIT (3.8% on investment income if MAGI > threshold)
   - IRMAA (Medicare Part B/D surcharges based on MAGI)
```

**State Tax:**
- Pluggable state modules
- State-specific: brackets, exemptions, SS treatment
- Retirement income exclusions

**MAGI Calculation (for IRMAA, SS taxation):**
```
MAGI = AGI + tax-exempt interest + excluded foreign income
```

**Fixed-Point Iteration:**
```
initial_withdrawal_guess = shortfall_without_taxes
tolerance = 0.01  // $0.01

DO:
  withdrawal = guess
  taxable_income = calc_taxable(withdrawal)
  tax = calc_tax(taxable_income)
  new_shortfall = expenses + tax - (income + other_sources)
  new_guess = max(0, new_shortfall)
  
  IF abs(new_guess - guess) < tolerance:
    CONVERGED = true
  ELSE:
    guess = new_guess
    
WHILE not CONVERGED and iterations < 20
```

### Monte Carlo Implementation

```
FOR path k = 1 to N_simulations:

  1. Draw return vector
     r_k ~ MultivariateNormal(μ, Σ)
     where μ = expected returns from return_model
           Σ = covariance_matrix
  
  2. Run deterministic engine with r_k(t)
     → produces terminal_wealth_k, annual_spending_k[], etc.
  
  3. Evaluate success
     success_k = (terminal_wealth_k >= goal_target) AND
                 (no_shortfalls OR shortfalls_within_tolerance)

END FOR

success_probability = (Σ success_k) / N
percentiles = compute_percentile(terminal_wealth[], [10, 50, 90])
```

---

## 4. API Contracts

### Household Management

**POST /households**
```json
{
  "name": "Smith Family",
  "primary_advisor_id": "uuid",
  "service_tier": "premium"
}
```
Response: `{ household_id }`

**POST /households/{id}/people**
```json
{
  "first_name": "John",
  "last_name": "Smith",
  "dob": "1975-06-15",
  "ssn_last4": "1234",
  "state_residence": "AZ"
}
```

**POST /households/{id}/accounts**
```json
{
  "custodian": "schwab",
  "account_type": "roth_ira",
  "registration_type": "individual",
  "opened_date": "2010-01-01"
}
```

### Planning

**POST /plans**
```json
{
  "household_id": "uuid",
  "plan_name": "Retirement Plan 2026"
}
```

**POST /plans/{id}/scenarios**
```json
{
  "scenario_name": "Base Case",
  "status": "active"
}
```

**POST /scenarios/{id}/assumption-sets**
```json
{
  "valuation_as_of_date": "2026-02-23",
  "inflation_cpi": 0.03,
  "healthcare_inflation": 0.05,
  "return_model_id": "uuid",
  "tax_rule_set_federal_id": "uuid",
  "tax_rule_set_state_id": "uuid"
}
```

**POST /scenarios/{id}/runs**
```json
{
  "run_type": "monte_carlo",
  "num_simulations": 2000,
  "horizon_years": 30
}
```
Response: `{ run_id, status: "queued" }`

### Outputs

**GET /runs/{id}/status**
```json
{
  "run_id": "uuid",
  "status": "complete",
  "progress": 100,
  "started_at": "...",
  "completed_at": "..."
}
```

**GET /runs/{id}/summary**
```json
{
  "success_probability": 0.87,
  "median_terminal_wealth": 2500000,
  "p10_terminal_wealth": 850000,
  "p90_terminal_wealth": 5200000,
  "max_drawdown_median": 0.32
}
```

**GET /runs/{id}/timeseries?dimension=portfolio_value&percentile=50**
```json
[
  { "period": "2026-01", "value": 1000000 },
  { "period": "2026-02", "value": 1005000 },
  ...
]
```

**GET /runs/{id}/recommendations**
```json
[
  {
    "category": "tax",
    "title": "Roth Conversion Opportunity",
    "description": "Convert $50K from Traditional IRA to Roth...",
    "impact_estimate": {
      "tax_savings_lifetime": 45000,
      "probability_increase": 0.03
    },
    "confidence": 0.85,
    "requires_approval": true
  }
]
```

---

## 5. Implementation Priority

### Phase 1: Foundation (Weeks 1-2)

**Database Schema**
- [ ] Complete DDL (all tables, constraints, indexes)
- [ ] Audit triggers
- [ ] Migration framework (Flyway or similar)
- [ ] Seed data (sample household, tax rules 2024-2026)

**Planning Graph Service**
- [ ] Household CRUD
- [ ] Person/Entity CRUD
- [ ] Relationship management
- [ ] Ownership tracking
- [ ] Account linking
- [ ] Position ingestion

**Assumptions Service**
- [ ] Return model CRUD
- [ ] Tax rule set versioning
- [ ] Assumption set creation with hashing
- [ ] Admin UI for CMAs

### Phase 2: Core Engine (Weeks 3-4)

**Deterministic Projection**
- [ ] Monthly time-stepping loop
- [ ] Income aggregation
- [ ] Expense aggregation
- [ ] Portfolio return application
- [ ] Withdrawal sequencing
- [ ] Goal funding logic

**Tax Calculator**
- [ ] Federal tax (bracket schedule)
- [ ] Capital gains (preferential rates)
- [ ] NIIT calculation
- [ ] IRMAA thresholds
- [ ] State tax (start with AZ, CA, NY)
- [ ] Fixed-point iteration solver

**RMD Logic**
- [ ] Age 72+ detection
- [ ] IRS Uniform Lifetime Table
- [ ] Cascade to taxable income

### Phase 3: Monte Carlo (Weeks 5-6)

**Stochastic Engine**
- [ ] Multivariate normal return draws
- [ ] Parallel path execution
- [ ] Percentile aggregation
- [ ] Success probability calculation
- [ ] Distribution summary stats

**Run Orchestration**
- [ ] Queue integration (BullMQ)
- [ ] Progress tracking
- [ ] Websocket updates
- [ ] Result caching (keyed by assumption hash)

**Recommendations**
- [ ] Rule engine framework
- [ ] Roth conversion detector
- [ ] Tax-loss harvesting triggers
- [ ] Insurance gap analysis
- [ ] Emergency fund alerts
- [ ] Impact quantification

### Phase 4: Reporting (Weeks 7-8)

**Client Outputs**
- [ ] PDF generation (branded)
- [ ] Scenario comparison view
- [ ] Goal progress tracking
- [ ] Recommendation summary

**Compliance**
- [ ] Immutable plan snapshots
- [ ] Audit log export
- [ ] Disclosure embedding
- [ ] Assumptions documentation

**Admin Tools**
- [ ] Plan run monitoring
- [ ] Error diagnostics
- [ ] Performance metrics
- [ ] Queue management

---

## 6. Technology Stack

**Backend:**
- Node.js (v22+) / Bun for hot paths
- TypeScript (strict mode)
- Express or Fastify for API

**Database:**
- PostgreSQL 15+ (JSONB, GIN indexes)
- pgvector extension (for future ML features)

**Queue & Cache:**
- Redis 7+
- BullMQ for async jobs

**Calculation:**
- Native JS for speed
- Consider WASM for matrix ops (future)

**API:**
- RESTful + WebSocket for progress
- OpenAPI 3.0 spec
- Request validation (Joi/Zod)

**Testing:**
- Jest for unit tests
- Supertest for API tests
- Test coverage >80%

**DevOps:**
- Docker + Docker Compose
- Railway for hosting (current)
- GitHub Actions for CI/CD

---

## 7. Performance Targets

**Calculation Engine:**
- Deterministic (30yr, monthly): <2 seconds
- Monte Carlo (2,000 paths): <10 seconds
- Monte Carlo (10,000 paths): <30 seconds

**API:**
- Plan CRUD: <100ms
- Run trigger: <200ms
- Status poll: <50ms
- Result retrieval: <500ms

**Database:**
- Household query: <50ms
- Timeseries fetch: <200ms (with pagination)
- Audit log write: async, non-blocking

**Caching Strategy:**
- Assumption set hash → calculation results
- TTL: 1 hour for draft, 24 hours for approved
- Invalidation: on assumption change

---

## 8. Security & Compliance

**Data Protection:**
- Encrypt PII at rest (SSN, tax IDs)
- Use pgcrypto or app-level encryption
- Secure key management (env vars, secrets manager)

**Access Control:**
- Role-based (advisor, client, admin, compliance)
- Household-level permissions
- Audit every access (who, what, when)

**Compliance:**
- SOC 2 Type II readiness
- FINRA record retention (7 years)
- Immutable plan exports
- Timestamp all recommendations
- Disclosure versioning

**API Security:**
- OAuth 2.0 / JWT
- Rate limiting (by advisor)
- Input validation + sanitization
- SQL injection prevention (parameterized queries)

---

## 9. Monitoring & Observability

**Metrics:**
- Run completion rate
- Average run duration
- Error rate by service
- Queue depth
- Cache hit ratio

**Alerts:**
- Run failure (advisor notification)
- Queue backup (>100 jobs)
- Database connection pool exhaustion
- Disk space <20%

**Logging:**
- Structured JSON logs
- Correlation IDs across services
- Request/response logging (sanitized)
- Error stack traces

**Dashboards:**
- Active runs
- Success probability distribution
- Recommendation adoption rate
- API latency (p50, p95, p99)

---

## 10. Next Steps

**Immediate (This Week):**
1. Generate complete SQL DDL
2. Set up repo structure (monorepo vs services)
3. Create Docker Compose for local dev
4. Build Planning Graph Service skeleton
5. Implement first API endpoint (POST /households)

**Week 1 Goal:**
- Complete database schema deployed
- Planning Graph Service CRUD operational
- Sample household + accounts loaded
- First API integration test passing

**Success Criteria:**
- Can create household graph via API
- Data persists correctly
- Audit log captures all changes
- Performance <100ms for CRUD ops

---

**Status: Ready to implement.**  
**Tim's approval required to begin 8-week build.**
