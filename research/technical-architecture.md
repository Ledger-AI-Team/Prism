# Technical Architecture: Farther Risk Assessment & Planning Platform
**Version:** 1.0  
**Date:** February 22, 2026  
**Architect:** Ledger (Farther Technology Team)

---

## Executive Summary

This document defines the technical architecture for Farther's wealth management platform, emphasizing:
- **Unified client data model** (single source of truth across risk, planning, portfolio, behavioral signals)
- **Real-time intelligence** (continuous monitoring vs. batch processing)
- **Embedded experience** (risk + planning integrated into advisor workflow, not separate tools)
- **AI orchestration** (proactive insights, natural language queries, automated workflows)
- **Regulatory compliance by design** (SOC 2, SEC, FINRA audit trails built-in)

**Design Principles:**
1. **Data flows down, intelligence flows up** - Raw data (positions, market prices, interactions) flows into unified graph; AI insights surface to advisors
2. **Everything is an event** - Every client action, market change, risk threshold breach generates events that trigger workflows
3. **Optimize for advisor velocity** - Reduce time from prospect → onboarded client from weeks to hours
4. **Compliance is automatic, not manual** - Audit trails generated as byproduct of normal workflow, not separate documentation step

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ADVISOR INTERFACE LAYER                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Advisor    │  │   Client     │  │  Compliance  │              │
│  │  Dashboard   │  │    Portal    │  │   Console    │              │
│  │  (React/TS)  │  │  (React/TS)  │  │  (React/TS)  │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                  │                  │                       │
│         └──────────────────┴──────────────────┘                      │
│                            │                                          │
└────────────────────────────┼──────────────────────────────────────────┘
                             │
┌────────────────────────────┼──────────────────────────────────────────┐
│                    API GATEWAY (Bun/TypeScript)                       │
│                 Authentication, Rate Limiting, Routing                │
└────────────────────────────┼──────────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
┌────────▼────────┐  ┌───────▼────────┐  ┌──────▼─────────┐
│   CORE SERVICES │  │  AI ORCHESTR.  │  │  INTEGRATION   │
│   (Bun/TS)      │  │  (Bun/TS)      │  │  SERVICES      │
├─────────────────┤  ├────────────────┤  ├────────────────┤
│• Risk Engine    │  │• Behavioral    │  │• HubSpot CRM   │
│• Portfolio Svc  │  │  Monitoring    │  │• Custodian     │
│• Planning Svc   │  │• Proactive     │  │  Feeds         │
│• Compliance Svc │  │  Alerts        │  │• Bloomberg/    │
│• Document Gen   │  │• NL Query      │  │  FactSet       │
│• Rebalancing    │  │• LLM Router    │  │• StratiFi (Y1) │
└────────┬────────┘  └───────┬────────┘  │• RightCapital  │
         │                   │            └────────┬───────┘
         └───────────────────┼────────────────────┘
                             │
┌────────────────────────────┼──────────────────────────────────────────┐
│                     DATA & INTELLIGENCE LAYER                         │
│  ┌────────────────────────────────────────────────────────────┐      │
│  │              UNIFIED CLIENT GRAPH (CockroachDB)            │      │
│  │  • Client profile (demographics, risk tolerance, goals)    │      │
│  │  • Portfolio holdings (positions, cost basis, performance) │      │
│  │  • Behavioral signals (interactions, panic indicators)     │      │
│  │  • Planning data (cash flows, scenarios, recommendations)  │      │
│  │  • Multi-region, low-latency reads, strong consistency     │      │
│  └────────────────────────────────────────────────────────────┘      │
│                                                                        │
│  ┌────────────────────────────────────────────────────────────┐      │
│  │       TRANSACTIONAL DATA (Aurora PostgreSQL)               │      │
│  │  • Trade orders, rebalancing history                       │      │
│  │  • Compliance audit logs (every action, timestamped)       │      │
│  │  • Document versions (IPS, proposals, reports)             │      │
│  │  • ACID guarantees for regulatory compliance               │      │
│  └────────────────────────────────────────────────────────────┘      │
│                                                                        │
│  ┌────────────────────────────────────────────────────────────┐      │
│  │         ANALYTICS DATA WAREHOUSE (Snowflake/Redshift)      │      │
│  │  • Historical performance, risk metrics, client growth     │      │
│  │  • Tableau data sources                                    │      │
│  │  • Batch ETL from Aurora + CockroachDB (nightly)           │      │
│  └────────────────────────────────────────────────────────────┘      │
└────────────────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────┼──────────────────────────────────────────┐
│                    AUTOMATION & WORKFLOW LAYER                        │
│                          (n8n self-hosted)                            │
│  • Statement scanning (OCR) → portfolio ingestion                    │
│  • Risk drift detection → advisor alert + client communication       │
│  • Quarterly review trigger → proposal regeneration                  │
│  • Tax deadline approaching → proactive tax-loss harvesting review   │
│  • IPS changes → compliance approval workflow                        │
└───────────────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────┼──────────────────────────────────────────┐
│                     INFRASTRUCTURE LAYER (AWS + GCP)                  │
│  • Compute: ECS/Fargate (Bun containers), Lambda (event handlers)   │
│  • Storage: S3 (documents, statements), CloudFront (CDN)             │
│  • Security: VPC isolation, IAM roles, KMS encryption                │
│  • Monitoring: CloudWatch, Datadog (metrics, logs, traces)           │
│  • Secrets: AWS Secrets Manager, HashiCorp Vault                     │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Data Architecture

### Unified Client Graph Schema (CockroachDB)

**Why CockroachDB:**
- Multi-region distribution (low-latency reads for advisors across US)
- Horizontal scalability (10K clients → 100K clients without re-architecture)
- Strong consistency (risk assessments must be accurate, no eventual consistency)
- SQL interface (team familiarity, easier than NoSQL for financial queries)

**Core Entities:**

```sql
-- Client (household-level record)
CREATE TABLE clients (
    client_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_name TEXT NOT NULL,
    primary_contact_id UUID REFERENCES contacts(contact_id),
    advisor_id UUID REFERENCES advisors(advisor_id),
    risk_profile_id UUID REFERENCES risk_profiles(risk_profile_id),
    aum_current DECIMAL(15,2),
    client_since DATE,
    lifecycle_stage TEXT, -- prospect | onboarding | active | churned
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risk Profile (behavioral + capacity)
CREATE TABLE risk_profiles (
    risk_profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(client_id),
    assessment_date DATE NOT NULL,
    
    -- Behavioral dimensions (Prospect Theory)
    loss_aversion_score DECIMAL(5,2), -- 0-100
    volatility_tolerance DECIMAL(5,2), -- 0-100
    time_horizon_years INT,
    liquidity_needs TEXT, -- high | medium | low
    
    -- Capacity dimensions
    max_drawdown_capacity DECIMAL(5,2), -- % portfolio can lose before lifestyle impact
    recovery_capacity_years INT, -- years to recover from major loss
    income_stability TEXT, -- stable | variable | retired
    
    -- Composite scores
    risk_willingness_score DECIMAL(5,2), -- behavioral-driven
    risk_capacity_score DECIMAL(5,2), -- financial-driven
    recommended_risk_level DECIMAL(5,2), -- min(willingness, capacity)
    
    -- Factor risk decomposition
    concentration_risk DECIMAL(5,2),
    sector_risk JSONB, -- {"tech": 22%, "healthcare": 15%, ...}
    geographic_risk JSONB,
    liquidity_risk DECIMAL(5,2),
    
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio Holdings (current positions)
CREATE TABLE portfolio_holdings (
    holding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(client_id),
    account_id UUID REFERENCES accounts(account_id),
    security_id TEXT NOT NULL, -- ticker or CUSIP
    quantity DECIMAL(18,6),
    cost_basis DECIMAL(15,2),
    current_value DECIMAL(15,2),
    unrealized_gain_loss DECIMAL(15,2),
    asset_class TEXT, -- equity | fixed_income | alternatives | cash
    as_of_date DATE NOT NULL,
    
    PRIMARY KEY (client_id, account_id, security_id, as_of_date)
);

-- Behavioral Signals (AI-generated insights)
CREATE TABLE behavioral_signals (
    signal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(client_id),
    signal_type TEXT NOT NULL, -- panic_indicator | satisfaction | engagement
    signal_value DECIMAL(5,2), -- 0-100 score
    trigger_event TEXT, -- market_drop | portfolio_loss | advisor_meeting
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    advisor_action_taken BOOLEAN DEFAULT FALSE,
    notes TEXT
);

-- Compliance Audit Log (immutable, append-only)
CREATE TABLE compliance_audit_log (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(client_id),
    action_type TEXT NOT NULL, -- risk_assessment | proposal_generated | ips_signed | trade_executed
    action_details JSONB NOT NULL,
    performed_by UUID REFERENCES users(user_id),
    performed_at TIMESTAMPTZ DEFAULT NOW(),
    regulatory_basis TEXT, -- SEC_Marketing_Rule | Reg_BI | Fiduciary_Standard
    related_document_id UUID -- link to stored document
);
```

**Data Locality Strategy:**
- **Primary region:** US-West (Phoenix proximity for low latency)
- **Replica regions:** US-East, US-Central (multi-region disaster recovery)
- **Partition key:** `client_id` (ensures all client data co-located for fast queries)

---

### Transactional Data (Aurora PostgreSQL)

**Why Aurora:**
- ACID compliance for regulatory requirements (trade orders, compliance logs must be durable)
- High write throughput for trade execution
- Point-in-time recovery (regulatory requirement for data retention)
- Auto-scaling read replicas for reporting queries (Tableau analytics)

**Core Tables:**

```sql
-- Trade Orders (executed trades, immutable)
CREATE TABLE trade_orders (
    order_id UUID PRIMARY KEY,
    client_id UUID NOT NULL,
    account_id UUID NOT NULL,
    security_id TEXT NOT NULL,
    order_type TEXT NOT NULL, -- buy | sell | rebalance
    quantity DECIMAL(18,6),
    price DECIMAL(15,4),
    trade_date DATE NOT NULL,
    settlement_date DATE NOT NULL,
    tax_lot_method TEXT, -- FIFO | LIFO | SpecID | TaxOptimized
    executed_by UUID REFERENCES users(user_id),
    compliance_approved_by UUID REFERENCES users(user_id),
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document Versions (IPS, proposals, reports - immutable history)
CREATE TABLE document_versions (
    version_id UUID PRIMARY KEY,
    document_id UUID NOT NULL, -- logical document (all versions share this)
    client_id UUID NOT NULL,
    document_type TEXT NOT NULL, -- ips | proposal | quarterly_report
    version_number INT NOT NULL,
    content_url TEXT NOT NULL, -- S3 path
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    generated_by UUID REFERENCES users(user_id),
    client_signed BOOLEAN DEFAULT FALSE,
    signature_date TIMESTAMPTZ,
    
    UNIQUE(document_id, version_number)
);
```

**Backup Strategy:**
- Continuous backup to S3 (Aurora automated backups)
- 7-year retention (SEC Books and Records Rule 204-2 requirement)
- Cross-region replication for disaster recovery

---

## Core Services Architecture

### 1. Risk Engine Service

**Responsibilities:**
- Calculate risk scores (behavioral + capacity + factor decomposition)
- Run Monte Carlo simulations (10,000+ scenarios per portfolio)
- Stress test portfolios (historical + hypothetical scenarios)
- Detect drift (portfolio risk vs. client tolerance)

**Technology:**
- **Runtime:** Bun (3x faster JavaScript execution vs. Node.js - critical for Monte Carlo performance)
- **Libraries:** 
  - `simple-statistics` for distributions
  - Custom Monte Carlo engine (Geometric Brownian Motion for returns)
  - `mathjs` for linear algebra (factor decomposition)

**API Endpoints:**

```typescript
// POST /api/v1/risk/assess
// Body: { clientId, portfolioHoldings[], questionnaire }
// Response: { riskProfile, recommendedAllocation, gaps[] }

interface RiskAssessmentRequest {
  clientId: string;
  portfolioHoldings: Holding[];
  questionnaire: {
    lossAversionResponses: number[];
    timeHorizon: number;
    liquidityNeeds: 'high' | 'medium' | 'low';
    incomeStability: 'stable' | 'variable' | 'retired';
  };
}

interface RiskAssessmentResponse {
  riskProfile: {
    riskWillingness: number; // 0-100
    riskCapacity: number; // 0-100
    recommendedRiskLevel: number; // min(willingness, capacity)
  };
  factorRisk: {
    concentration: number;
    sectorExposure: Record<string, number>;
    volatility: number;
  };
  monteCarloResults: {
    successProbability: number; // % of scenarios meeting goals
    medianEndingValue: number;
    worstCase5thPercentile: number;
    bestCase95thPercentile: number;
  };
  gaps: string[]; // ["Portfolio risk (75) exceeds client capacity (60)", ...]
}
```

**Performance Target:**
- Risk assessment: <2 seconds (including Monte Carlo 10K simulations)
- Batch re-assessment (all clients): <10 minutes (parallelized across Bun workers)

---

### 2. AI Orchestration Service

**Responsibilities:**
- Monitor behavioral signals (client interactions, market events)
- Generate proactive alerts ("Client X likely to panic based on tech sector drop")
- Natural language query interface ("Show clients with >20% tech concentration")
- Auto-draft advisor talking points

**Technology:**
- **LLM:** OpenAI GPT-4 / Anthropic Claude (via API)
- **Vector DB:** Pinecone or pgvector (for semantic search over client interactions)
- **Event processing:** Bull (Redis-backed job queue for async tasks)

**Workflows:**

```typescript
// Behavioral Monitoring (runs every 15 minutes)
async function monitorBehavioralSignals() {
  const marketEvents = await getRecentMarketEvents(); // e.g., NASDAQ down 5%
  const atRiskClients = await db.query(`
    SELECT c.client_id, c.household_name, r.loss_aversion_score, p.holdings
    FROM clients c
    JOIN risk_profiles r ON c.risk_profile_id = r.risk_profile_id
    JOIN portfolio_holdings p ON c.client_id = p.client_id
    WHERE r.loss_aversion_score > 70 -- high panic risk
      AND p.sector_risk->>'tech' > '15' -- concentrated in tech
  `);
  
  for (const client of atRiskClients) {
    const alert = await generateProactiveAlert(client, marketEvents);
    await notifyAdvisor(client.advisor_id, alert);
  }
}

// Natural Language Query (advisor types question in plain English)
async function handleNaturalLanguageQuery(query: string): Promise<Client[]> {
  // Convert NL query to SQL using LLM
  const sqlQuery = await llm.complete({
    prompt: `Convert this advisor query to SQL against the clients and risk_profiles tables:
    "${query}"
    
    Schema:
    - clients: client_id, household_name, advisor_id, aum_current
    - risk_profiles: risk_profile_id, client_id, concentration_risk, sector_risk (JSONB)
    
    Return only the SQL query, no explanation.`,
  });
  
  return await db.query(sqlQuery);
}
```

---

### 3. Tax-Optimized Rebalancing Service

**Differentiator:** Orchestrates trades across multiple accounts to minimize tax impact at household level.

**Algorithm:**

```typescript
interface RebalanceRequest {
  clientId: string;
  targetAllocation: Record<string, number>; // { "VTI": 60, "BND": 40 }
  accounts: Account[]; // taxable, IRA, Roth
}

async function optimizeRebalancing(request: RebalanceRequest): Promise<Trade[]> {
  // 1. Calculate deviation from target
  const currentAllocations = await getCurrentHoldings(request.clientId);
  const deviations = calculateDeviations(currentAllocations, request.targetAllocation);
  
  // 2. Tax-aware trade routing
  const trades: Trade[] = [];
  
  // Rule: Sell losers in taxable (harvest losses)
  // Rule: Sell winners in IRA (no capital gains)
  // Rule: Buy in Roth first (tax-free growth on new purchases)
  
  for (const [security, deviation] of Object.entries(deviations)) {
    if (deviation < 0) { // Need to sell
      const taxableHoldings = request.accounts.find(a => a.type === 'taxable')?.holdings[security];
      if (taxableHoldings && taxableHoldings.unrealizedGainLoss < 0) {
        // Sell in taxable to harvest loss
        trades.push({ account: 'taxable', action: 'sell', security, quantity: Math.abs(deviation) });
      } else {
        // Sell in IRA (no tax impact)
        trades.push({ account: 'ira', action: 'sell', security, quantity: Math.abs(deviation) });
      }
    } else { // Need to buy
      // Buy in Roth first
      trades.push({ account: 'roth', action: 'buy', security, quantity: deviation });
    }
  }
  
  return trades;
}
```

**Integration:** Connects to custodian APIs (Schwab, Fidelity) to execute trades.

---

## Integration Architecture

### HubSpot CRM Integration

**Data Flow:**
- **HubSpot → Farther:** New leads, client contact info, meeting notes
- **Farther → HubSpot:** Risk scores, proposal status, AUM growth

**Implementation:**
- **n8n workflow:** Poll HubSpot API every 5 minutes for new contacts → create client record in Farther
- **Webhooks:** Farther sends risk assessment completion → HubSpot creates task "Review proposal with client"

---

### Custodian Feed Integration (Schwab, Fidelity)

**Data Flow:**
- **Custodian → Farther:** Daily position files, trade confirmations, cost basis
- **Farther → Custodian:** Trade orders for rebalancing

**Implementation:**
- **SFTP:** Custodians provide daily position files (CSV) → automated ingestion via n8n
- **API:** Modern custodians (Schwab OpenAPI) provide real-time position queries

---

### Financial Data APIs (Bloomberg, FactSet)

**Data Flow:**
- **Bloomberg → Farther:** Security master (tickers, CUSIPs, company info), pricing, factor exposures
- **Use case:** Risk calculations require factor exposures (e.g., "What's the beta of VTI to S&P 500?")

**Implementation:**
- **Bloomberg BPIPE:** WebSocket connection for real-time pricing
- **FactSet API:** RESTful queries for fundamental data, risk analytics

---

## Security & Compliance Architecture

### Data Encryption

**At Rest:**
- CockroachDB: Transparent Data Encryption (TDE) with AES-256
- Aurora PostgreSQL: AWS KMS encryption
- S3 documents: Server-side encryption (SSE-KMS)

**In Transit:**
- TLS 1.3 for all API communication
- VPN for advisor access to admin consoles

---

### Access Control

**Role-Based Access Control (RBAC):**

| Role | Access |
|------|--------|
| **Advisor** | Read/write own clients; read-only firm analytics |
| **Compliance Officer** | Read-only all clients; audit log access; approval workflows |
| **Portfolio Manager** | Execute trades; rebalancing workflows |
| **Admin** | User management, system configuration |

**Implementation:**
- JWT tokens with role claims
- Row-level security in CockroachDB: `WHERE advisor_id = current_user_id()`

---

### Audit Trail

**SEC Requirement:** Every action affecting a client must be logged with timestamp, user, and rationale.

**Implementation:**
- `compliance_audit_log` table in Aurora (immutable, append-only)
- Triggered automatically by application logic (not manual logging)

**Example:**

```typescript
async function generateProposal(clientId: string, proposalData: any, userId: string) {
  // Business logic: create proposal
  const proposal = await createProposal(clientId, proposalData);
  
  // Compliance logging (automatic)
  await db.query(`
    INSERT INTO compliance_audit_log (client_id, action_type, action_details, performed_by, regulatory_basis)
    VALUES ($1, 'proposal_generated', $2, $3, 'SEC_Marketing_Rule')
  `, [clientId, JSON.stringify(proposalData), userId]);
  
  return proposal;
}
```

---

## Scalability & Performance

### Current Scale (Year 1)
- **Clients:** 1,000-5,000
- **Advisors:** 10-50
- **Queries/second:** ~50 QPS (advisor dashboard loads)
- **Batch jobs:** Nightly risk re-assessment for all portfolios

### Target Scale (Year 3)
- **Clients:** 50,000-100,000
- **Advisors:** 200-500
- **Queries/second:** ~500 QPS
- **Real-time:** Continuous risk monitoring (not batch)

### Scaling Strategy

**Database:**
- CockroachDB: Add nodes as client count grows (linear scaling)
- Aurora PostgreSQL: Read replicas for analytics queries (Tableau)

**Compute:**
- Bun services: Horizontal scaling via ECS/Fargate (auto-scaling based on CPU)
- Serverless functions (Lambda) for event-driven tasks (low-volume workflows)

**Caching:**
- Redis for frequently accessed data (client risk scores, portfolio summaries)
- TTL: 15 minutes (balance freshness vs. load)

---

## Monitoring & Observability

**Metrics to Track:**
- **Latency:** P50, P95, P99 for API endpoints (target: P95 <500ms)
- **Throughput:** Requests/second per service
- **Error rate:** % of failed requests (target: <0.1%)
- **Data freshness:** Lag between custodian data ingestion and availability in UI

**Tools:**
- **Datadog:** Unified metrics, logs, traces
- **PagerDuty:** On-call alerting for production incidents
- **Sentry:** Error tracking and crash reporting

---

## Disaster Recovery

**RTO (Recovery Time Objective):** 4 hours (regulatory requirement: must restore service within business day)

**RPO (Recovery Point Objective):** 15 minutes (maximum acceptable data loss)

**Strategy:**
- **CockroachDB:** Multi-region by default (automatic failover)
- **Aurora PostgreSQL:** Automated backups every 15 minutes; cross-region replica
- **Runbook:** Documented failover procedures for each component

---

## Technology Stack Summary

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | React + TypeScript | Modern, type-safe, component reusability |
| **Backend** | Bun + TypeScript | 3x faster than Node.js; critical for Monte Carlo performance |
| **Client Graph DB** | CockroachDB | Multi-region, SQL interface, horizontal scaling |
| **Transactional DB** | Aurora PostgreSQL | ACID compliance, regulatory requirement |
| **Analytics** | Tableau + D3/Plotly | Advisor dashboards (Tableau), client visualizations (D3) |
| **Automation** | n8n (self-hosted) | Data sovereignty, custom workflows |
| **AI** | OpenAI GPT-4 / Anthropic Claude | Natural language queries, behavioral insights |
| **Infrastructure** | AWS (primary) + GCP (backup) | Multi-cloud resilience |
| **Monitoring** | Datadog + Sentry | Unified observability |

---

## Next Steps

1. **Prototype risk engine** (Monte Carlo + factor risk) - 4 weeks
2. **Build unified client graph schema** - 2 weeks
3. **Integrate HubSpot CRM** - 2 weeks
4. **Implement compliance audit logging** - 2 weeks
5. **Deploy MVP to internal advisors** - 8 weeks total

**First 100 days:** Ship internal MVP with core workflows (risk assessment → proposal → IPS).
