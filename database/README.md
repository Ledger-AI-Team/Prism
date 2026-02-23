## Farther Prism - Database Schema

**Version:** 1.0.0  
**Date:** February 23, 2026  
**Author:** Ledger (Ledger@The-AI-Team.io)

---

## Overview

Institutional-grade PostgreSQL schema for financial planning software. Supports household-first planning with versioned scenarios, immutable audit trails, and full tax-lot tracking.

### Key Features

✅ **Household Graph** - People, entities, relationships, ownership  
✅ **Account Management** - Multi-custodian with lot-level tracking  
✅ **Income & Expenses** - Recurring streams with inflation adjustment  
✅ **Goals & Constraints** - Priority-based with success metrics  
✅ **Tax System** - Versioned rules (federal + state), IRMAA, NIIT  
✅ **Planning** - Scenarios, assumptions, runs (deterministic/MC/optimization)  
✅ **Projections** - Monthly time-series with percentile outputs  
✅ **Recommendations** - AI-generated opportunities with approval workflow  
✅ **Audit Trail** - Immutable log of all mutations  

---

## Schema Files

| File | Description |
|------|-------------|
| `01-core-schema.sql` | Core entities: households, people, accounts, income, expenses, goals |
| `02-planning-schema.sql` | Planning entities: tax profiles, plans, scenarios, runs, recommendations |
| `03-views-functions.sql` | Views, helper functions, triggers, indexes |
| `04-seed-data.sql` | Seed data: tax rules, return models, sample household |

---

## Database Statistics

- **Tables:** 40+ core tables
- **Views:** 6 analytical views
- **Functions:** 6 helper functions
- **Triggers:** 30+ audit + timestamp triggers
- **Indexes:** 100+ for performance

---

## Entity Relationship Overview

```
Households (root)
  ├─ People (members)
  ├─ Entities (trusts, LLCs)
  ├─ Relationships (spouse, child, dependent)
  ├─ Ownership (who owns what)
  ├─ Accounts (taxable, IRA, 401k, Roth, etc.)
  │   ├─ Positions (holdings)
  │   ├─ Lots (tax lot tracking)
  │   └─ Cash Movements (deposits, withdrawals, RMDs)
  ├─ Income Streams (W2, pension, SS, rental)
  ├─ Expense Streams (housing, healthcare, etc.)
  ├─ Goals (retirement, education, legacy)
  ├─ Constraints (min cash, max bracket, IRMAA limits)
  ├─ Policies (insurance)
  ├─ Risk Profiles (tolerance vs capacity)
  └─ Plans
      └─ Scenarios
          └─ Assumption Sets (immutable)
              └─ Plan Runs
                  ├─ Projection Timeseries
                  ├─ MC Distribution Summaries
                  └─ Recommendations
```

---

## Deployment

### Prerequisites

- PostgreSQL 15+
- Extensions: `uuid-ossp`, `pgcrypto`, `btree_gin`

### Quick Start

```bash
# 1. Create database
createdb farther_prism

# 2. Run schema files in order
psql farther_prism < schema/01-core-schema.sql
psql farther_prism < schema/02-planning-schema.sql
psql farther_prism < schema/03-views-functions.sql

# 3. Load seed data (optional)
psql farther_prism < schema/04-seed-data.sql
```

### Docker Compose

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: farther_prism
      POSTGRES_USER: prism_api
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./schema:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

---

## Performance Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| Household CRUD | <100ms | Create, read, update, delete |
| Household query | <50ms | Summary with portfolio value |
| Timeseries fetch | <200ms | Paginated (1,000 rows) |
| Deterministic run | <2s | 30-year monthly projection |
| Monte Carlo run | <10s | 2,000 simulations |

---

## Security

### Encryption

- **PII at rest:** SSN, tax IDs encrypted via `pgcrypto`
- **In transit:** TLS 1.3 required for connections
- **Application-level:** API enforces row-level security

### Access Control

- **Roles:**
  - `prism_api` - Full CRUD access (application)
  - `prism_readonly` - Read-only (reporting, analytics)
- **Row-level security:** Enabled on households table
- **Audit log:** Immutable trail (who, what, when)

### Compliance

- **SOC 2 Type II ready:** Audit triggers on all mutations
- **FINRA record retention:** 7-year retention policy
- **Immutable exports:** Plan snapshots with version hash

---

## Key Tables

### Core Identity

- **households** - Root node (primary planning unit)
- **people** - Household members (clients, dependents)
- **entities** - Legal entities (trusts, LLCs, foundations)
- **relationships** - Interpersonal relationships (spouse, child)
- **ownership** - Ownership graph (who owns what)

### Accounts & Holdings

- **accounts** - Financial accounts (typed: taxable, IRA, 401k, etc.)
- **security_master** - Security reference data
- **positions** - Holdings within accounts (time-series)
- **lots** - Tax lot tracking (cost basis, term)
- **cash_movements** - Deposits, withdrawals, RMDs, fees

### Cash Flow

- **income_streams** - Recurring income (W2, pension, SS)
- **expense_streams** - Recurring expenses (inflation-adjusted)
- **expense_categories** - Hierarchical categorization

### Goals & Constraints

- **goals** - Financial goals (retirement, education, legacy)
- **goal_cashflow_rules** - Rules for goal-driven cash flows
- **constraints** - Planning constraints (min cash, max bracket)

### Tax System

- **tax_profiles** - Household tax filing info
- **tax_rule_sets** - Versioned tax rules by jurisdiction/year

### Planning

- **plans** - Top-level container (1+ scenarios)
- **scenarios** - Plan variations (Base, Conservative, Aggressive)
- **assumption_sets** - Immutable snapshot of all assumptions
- **return_models** - Capital Market Assumptions (CMAs)

### Plan Outputs

- **plan_runs** - Execution records (deterministic/MC/optimization)
- **projection_timeseries** - Materialized output (portfolio, taxes, etc.)
- **mc_distribution_summaries** - Monte Carlo percentiles + success probability
- **recommendations** - AI-generated opportunities

### Audit

- **audit_log** - Immutable trail of all mutations
- **external_links** - CRM/custodian integrations

---

## Common Queries

### Get household portfolio value

```sql
SELECT * FROM v_household_summary
WHERE household_id = 'uuid-here';
```

### Get current holdings

```sql
SELECT * FROM v_account_holdings
WHERE household_id = 'uuid-here'
ORDER BY market_value DESC;
```

### Get asset allocation

```sql
SELECT * FROM v_portfolio_allocation
WHERE household_id = 'uuid-here'
ORDER BY market_value DESC;
```

### Get unrealized gains by tax lot

```sql
SELECT * FROM v_tax_lot_summary
WHERE account_id = 'uuid-here'
ORDER BY unrealized_gain_loss DESC;
```

### Get annual income & expenses

```sql
SELECT * FROM v_cashflow_summary
WHERE household_id = 'uuid-here';
```

### Get plan run status

```sql
SELECT * FROM v_plan_run_status
WHERE household_id = 'uuid-here'
ORDER BY queued_at DESC;
```

---

## Data Model Conventions

### Naming

- **Tables:** Plural nouns (`households`, `people`, `accounts`)
- **Columns:** Snake case (`household_id`, `base_amount`)
- **Indexes:** `idx_{table}_{columns}` pattern
- **Foreign keys:** `{referenced_table}_id` pattern

### ID Strategy

- **Primary keys:** UUID v4 (via `uuid_generate_v4()`)
- **Why:** Distributed-friendly, non-sequential, collision-resistant

### Timestamps

- **created_at:** Set on INSERT (default: `NOW()`)
- **updated_at:** Set on UPDATE (via trigger)
- **Timezone:** All timestamps stored as `TIMESTAMPTZ` (UTC)

### Soft Deletes

- **Status columns:** `status` field with values like `'active'`, `'archived'`, `'deleted'`
- **Why:** Preserve audit trail, support undelete

### JSON Columns

- **Type:** `JSONB` (not `JSON`)
- **Why:** Indexable, faster queries, binary storage
- **Use cases:** Tax rules, return models, recommendation impacts, metadata

---

## Indexing Strategy

### B-tree Indexes

- Primary keys, foreign keys
- Timestamp columns (DESC for recent-first queries)
- Status/type columns

### GIN Indexes

- JSONB columns (for fast JSON queries)
- Array columns (`tags`, `part_year_states`)

### Partial Indexes

- Filtered by status (`WHERE status = 'active'`)
- Filtered by date (`WHERE end_date IS NULL OR end_date >= CURRENT_DATE`)

### Composite Indexes

- Common query patterns (`account_id, as_of_date DESC, security_id`)

---

## Migration Strategy

### Version Control

- **Framework:** Flyway or Liquibase
- **Naming:** `V{version}__{description}.sql`
- **Example:** `V001__initial_schema.sql`

### Backward Compatibility

- Additive changes (new columns with defaults)
- Avoid breaking changes in production
- Deprecation warnings before removal

### Rollback Plan

- Always test migrations in staging
- Keep rollback scripts for critical changes
- Use transactions where possible

---

## Testing

### Unit Tests

- Test all functions (`calculate_age`, `get_household_portfolio_value`)
- Test all triggers (audit log, updated_at)
- Test constraints (check constraints, foreign keys)

### Integration Tests

- Test full CRUD workflows
- Test plan run orchestration
- Test recommendation generation

### Performance Tests

- Load test with realistic data volumes
- Query profiling (`EXPLAIN ANALYZE`)
- Index effectiveness monitoring

---

## Monitoring

### Key Metrics

- Query latency (p50, p95, p99)
- Connection pool utilization
- Cache hit ratio
- Table bloat
- Index usage statistics

### Alerts

- Long-running queries (>30s)
- Connection pool exhaustion
- Disk space <20%
- Replication lag (if using replicas)

### Dashboard

- Active connections
- Queries per second
- Top slow queries
- Table sizes
- Index sizes

---

## Backup & Recovery

### Backup Strategy

- **Full backup:** Daily at 2 AM UTC
- **WAL archiving:** Continuous (for point-in-time recovery)
- **Retention:** 30 days full, 90 days WAL

### Recovery

```bash
# Point-in-time recovery example
pg_restore -d farther_prism_restored /path/to/backup.dump
```

---

## ERD Diagram

See `ERD.md` for a visual Entity-Relationship Diagram (Mermaid format).

---

## Changelog

### v1.0.0 (2026-02-23)

- Initial schema release
- 40+ core tables
- Federal + state tax rules (2024)
- Sample household seed data
- 6 analytical views
- Complete audit trail
- Performance indexes

---

## Contact

**Questions or issues?**  
Ledger@The-AI-Team.io  
https://github.com/Ledger-AI-Team/Prism

---

## License

Proprietary - Farther, Inc.  
© 2026 All Rights Reserved.
