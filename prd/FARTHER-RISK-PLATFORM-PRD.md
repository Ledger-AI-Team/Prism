# FARTHER RISK ASSESSMENT & WEALTH PLANNING PLATFORM
## Product Requirements Document (PRD)

**Document Version:** 1.0  
**Date:** February 22, 2026  
**Author:** Ledger (Technology Strategy)  
**Owner:** Tim Bohnett, Managing Director  
**Classification:** Confidential — Internal Use Only

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Vision & Strategy](#vision-strategy)
3. [Market Analysis & Competitive Intelligence](#market-analysis)
4. [Technical Architecture](#technical-architecture)
5. [Quantitative Models & Risk Engine](#quantitative-models)
6. [Product Requirements & User Experience](#product-requirements)
7. [Regulatory Compliance Framework](#compliance)
8. [Implementation Roadmap](#roadmap)
9. [Resource Requirements & Budget](#resources)
10. [Success Metrics](#metrics)
11. [Risk Register](#risks)

---

## 1. Executive Summary {#executive-summary}

### The Opportunity

The wealth management software market is fragmented. Advisors juggle 4-6 disconnected platforms for risk assessment, financial planning, portfolio management, CRM, and compliance documentation. No platform delivers a unified, AI-native experience that scales from mass affluent ($500K) to UHNW ($500M+).

### The Product

Farther will build an **embedded risk assessment and wealth planning platform** that:

1. **Unifies** risk analysis, proposals, planning, and compliance into one advisor workflow
2. **Deploys AI** for continuous behavioral monitoring, proactive alerts, and natural language queries
3. **Automates compliance** as a byproduct of normal workflow (not a separate documentation task)
4. **Scales** from lightweight retirement projections to multi-generational, multi-entity wealth management
5. **Embeds** intelligence directly into the advisor experience (not a separate tool to log into)

### The Differentiation

| What Competitors Do | What Farther Does |
|---------------------|-------------------|
| Separate risk platform (login required) | Risk intelligence embedded in advisor workflow |
| Quarterly risk re-assessment (batch) | Continuous AI monitoring (15-minute cycles) |
| Single risk score (e.g., Risk Number) | Dual-dimension: behavioral willingness + financial capacity |
| Manual compliance documentation | Automatic audit trails on every action |
| Reactive (client calls → advisor scrambles) | Proactive (advisor calls client before they panic) |
| Different tools for different client tiers | One platform: $500K mass affluent → $500M UHNW |

### The Business Case

- **Competitive moat:** Proprietary AI orchestration layer + unified client graph creates switching costs competitors can't replicate by licensing the same vendor tools
- **Revenue impact:** Faster onboarding (2 weeks → 48 hours) + proactive engagement → higher conversion, retention, and wallet share
- **Cost efficiency:** Automated compliance saves ~60% of CCO time; automated reviews save ~80% of quarterly review cycle
- **Year 1 investment:** ~$1.5M (engineering + infrastructure)
- **Year 1 target:** 20 active advisors, $500M AUM on platform

---

## 2. Vision & Strategy {#vision-strategy}

### Product Vision

> **The advisor opens a client profile and everything is already there — risk DNA, portfolio health, tax opportunities, compliance status, next-best-action. No context switching. No re-entering data. Intelligence that feels like intuition.**

### Strategic Approach: Build the Orchestration Layer

**Year 1 (2026): Integrate + Automate**
- Build proprietary risk engine (behavioral + capacity scoring, Monte Carlo, factor decomposition)
- Build unified client graph (CockroachDB)
- Build AI orchestration layer (proactive monitoring, NL queries)
- Build compliance automation (immutable audit trails, automated IPS)
- Integrate HubSpot, custodian feeds, financial data APIs

**Year 2 (2027): Deepen + Differentiate**
- Add tax-optimized rebalancing (household-level)
- Add UHNW capabilities (business entity modeling, estate planning)
- Add client portal with interactive "what if" scenarios
- Embedded Tableau analytics for firm management

**Year 3 (2028): Scale + Dominate**
- Add alternative investment support (PE, hedge funds, real estate)
- Multi-generational wealth transfer modeling
- AI-powered plan generation (auto-draft from conversation transcripts)
- Open platform API (third-party advisor tools can plug in)

---

## 3. Market Analysis & Competitive Intelligence {#market-analysis}

**Full analysis:** See `research/competitive-analysis.md`

### Key Findings

**Market Leaders:**

| Platform | Strength | Weakness | Market Position |
|----------|----------|----------|-----------------|
| **StratiFi** | Behavioral risk depth, compliance automation | Separate platform, no planning, expensive | AI-native risk leader |
| **Nitrogen** | Brand recognition (Risk Number®), broad adoption | Single-dimension scoring, limited AI | Industry standard risk communication |
| **RightCapital** | Tax planning depth, AI integration, value pricing | Less aggregation than eMoney | Fastest-growing planning platform |
| **eMoney** | Premium client portal, deepest aggregation | Expensive, UI dated, AI lagging | Enterprise planning leader |

**Attack Surface (Where We Win):**

1. **Integration friction** — No platform owns the full stack. We build the connective tissue.
2. **Reactive intelligence** — Competitors assess risk on-demand. We monitor continuously.
3. **Tax optimization gap** — Platforms show tax *impact*; we optimize tax *routing* across accounts.
4. **Compliance burden** — Manual documentation is the norm. We automate it.
5. **Platform switching pain** — $500K client grows to $50M, advisor switches platforms. We scale seamlessly.

---

## 4. Technical Architecture {#technical-architecture}

**Full design:** See `research/technical-architecture.md`

### Stack Summary

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | React + TypeScript | Modern, type-safe, component-based |
| **Backend** | Bun + TypeScript | 3x Node.js performance; critical for Monte Carlo |
| **Client Graph** | CockroachDB | Multi-region SQL, horizontal scaling, strong consistency |
| **Transactional** | Aurora PostgreSQL | ACID compliance, 7-year retention, regulatory requirement |
| **Analytics** | Tableau + D3/Plotly | Advisor dashboards + client visualizations |
| **Automation** | n8n (self-hosted) | Data sovereignty, custom workflows |
| **AI** | OpenAI / Anthropic | NL queries, behavioral insights, draft generation |
| **Infrastructure** | AWS (primary) | ECS/Fargate, S3, KMS, CloudWatch |

### Core Data Model

**Unified Client Graph** stores all client data in one place:
- Demographics, goals, risk profile
- Portfolio holdings (all accounts, all custodians)
- Behavioral signals (interaction history, panic indicators)
- Planning data (cash flows, scenarios, recommendations)
- Compliance records (every action logged, immutable)

### Key Design Decisions

1. **CockroachDB for client graph** (not Aurora): Multi-region reads for distributed advisors; horizontal scaling
2. **Aurora for compliance logs** (not CockroachDB): ACID guarantees for regulatory audit trails; point-in-time recovery
3. **Bun runtime** (not Node.js): 3x performance for Monte Carlo simulations; critical for <2 second risk calculations
4. **n8n for automation** (not Zapier/Make): Self-hosted for data sovereignty; financial data never leaves Farther's infrastructure

---

## 5. Quantitative Models & Risk Engine {#quantitative-models}

**Full specifications:** See `research/quantitative-models.md`

### Risk Scoring Framework

**Dual-Dimension Model:**

```
Recommended Risk Level = min(Risk Willingness, Risk Capacity)

Risk Willingness (behavioral):
- Prospect Theory value function (Kahneman & Tversky)
- Loss aversion coefficient (λ) from questionnaire
- Volatility tolerance from scenario questions

Risk Capacity (financial):
- Max drawdown before lifestyle impact
- Recovery time horizon
- Income stability multiplier
```

**Why This Beats Competitors:**
- **Nitrogen:** Single composite score (misses capacity vs. willingness gap)
- **StratiFi:** Separates dimensions but proprietary model (we implement published research, fully transparent)
- **Farther:** Published academic foundations (Kahneman, Arrow-Pratt) + transparent methodology = trust + regulatory comfort

### Monte Carlo Engine

- **Simulations:** 10,000 per portfolio (parallelized across Bun worker threads)
- **Model:** Geometric Brownian Motion with log-normal returns
- **Performance:** <2 seconds per portfolio (8-core, parallelized)
- **Output:** Success probability, median, 5th percentile, 95th percentile, fan chart data

### Additional Risk Metrics

- **VaR / CVaR:** 95% and 99% confidence, both parametric and historical
- **Factor Decomposition:** Fama-French (market, size, value, momentum) + custom (sector, geographic, liquidity)
- **Stress Testing:** Historical scenarios (2008, COVID, tech bubble, rising rates) + hypothetical

---

## 6. Product Requirements & User Experience {#product-requirements}

**Full specifications:** See `research/product-requirements.md`

### User Personas

1. **Sarah (Solo RIA, 15 clients):** Needs speed — onboard clients in hours, not weeks
2. **Marcus (Enterprise Advisor, 200 clients):** Needs scale — automated reviews, proactive alerts
3. **Jennifer & Robert (Mass Affluent Clients):** Need clarity — "Are we going to be okay?"
4. **David & Catherine (UHNW Clients):** Need complexity — business entities, trusts, multi-generational
5. **Lisa (Chief Compliance Officer):** Needs visibility — real-time compliance dashboard

### Critical Workflows

1. **New Prospect → Onboarded Client:** Target <48 hours (current industry: 2-4 weeks)
2. **Ongoing Monitoring:** Continuous AI monitoring (current industry: quarterly batch)
3. **Quarterly Reviews:** Automated for 80% of clients (current industry: 100% manual)
4. **Rebalancing:** Tax-optimized, cross-account routing (current industry: per-account)

### Phased Feature Delivery

**Phase 1 (Months 1-6): MVP**
- Risk questionnaire + scoring engine
- Portfolio ingestion (OCR + manual)
- Monte Carlo projections
- Proposal generator
- IPS generator with e-signature
- Compliance audit logging
- HubSpot integration
- Advisor dashboard

**Phase 2 (Months 7-12): Intelligence**
- Continuous behavioral monitoring
- Proactive alert engine
- Natural language queries
- Client portal
- Interactive "what if" scenarios
- Automated quarterly reviews
- Compliance dashboard

**Phase 3 (Months 13-24): Advanced**
- Tax-optimized rebalancing
- Tax return OCR
- Business entity modeling (UHNW)
- Estate planning module
- Alternative investments
- Embedded Tableau analytics
- Factor risk decomposition
- Stress testing module

---

## 7. Regulatory Compliance Framework {#compliance}

**Full requirements:** See `research/compliance-requirements.md`

### Regulatory Landscape

| Regulation | Scope | Key Requirement |
|-----------|-------|-----------------|
| **SEC Marketing Rule** | All RIA communications | Hypothetical projections must be labeled, balanced, disclaimed |
| **Reg BI** | Broker-dealer recommendations | Document suitability basis, disclose conflicts, show alternatives |
| **Fiduciary Duty** | RIA standard | Ongoing monitoring obligation; act in client's best interest always |
| **SEC Rule 204-2** | Books and records | 7-year retention of all client documents and communications |
| **SOC 2 Type II** | Data security | Third-party attestation of security controls |
| **CCPA** | California privacy | Right to know, right to delete, opt-out of data sharing |

### Compliance by Design

**Principle:** Every action in the platform auto-generates compliance documentation.

- Risk assessment → audit log entry + suitability documentation
- Proposal generation → audit log + disclosure injection + conflict check
- IPS signing → immutable document storage + audit log
- Trade execution → audit log + suitability basis + tax impact documentation
- Client communication → HubSpot → compliance log sync

**Result:** SEC examination preparation goes from "scramble for 2 weeks" to "pull the report in 15 minutes."

### SOC 2 Timeline

- **Month 1-3:** Readiness assessment, implement controls
- **Month 4:** SOC 2 Type I audit
- **Month 4-10:** Observation period
- **Month 10:** SOC 2 Type II audit completion

---

## 8. Implementation Roadmap {#roadmap}

### Phase 1: MVP (Months 1-6)

```
Month 1-2: Foundation
━━━━━━━━━━━━━━━━━━━━
• Database schemas (CockroachDB + Aurora)
• API framework (Bun + TypeScript)
• Authentication / RBAC
• CI/CD pipeline (GitHub Actions)
• Product design: wireframes + design system
• Compliance audit log implementation

Month 3-4: Core Engine
━━━━━━━━━━━━━━━━━━━━━━
• Risk questionnaire (frontend + backend)
• Risk scoring engine (Prospect Theory + Arrow-Pratt)
• Monte Carlo simulation engine
• Portfolio ingestion (CSV + basic OCR)
• HubSpot integration (contacts sync)

Month 5-6: Advisor Experience
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Advisor dashboard (client list, risk scores, alerts)
• Proposal generator (template + data merge)
• IPS generator (auto-populated + e-signature)
• Gap analysis visualization
• Internal beta testing
• SOC 2 readiness assessment

MILESTONE: Internal launch with 5-10 advisors
```

### Phase 2: Intelligence (Months 7-12)

```
Month 7-8: AI Layer
━━━━━━━━━━━━━━━━━━━
• Behavioral monitoring engine (market events × client profiles)
• Proactive alert system (advisor notifications)
• Natural language query interface
• Custodian feed integration (Schwab, Fidelity)

Month 9-10: Client Experience
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Client portal (risk profile, goals, projections)
• Interactive "what if" scenarios
• Automated quarterly review generation
• Bloomberg/FactSet data integration

Month 11-12: Scale & Compliance
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Compliance dashboard (CCO view)
• Performance optimization (caching, query optimization)
• SOC 2 Type II audit completion
• External beta: 20+ advisors

MILESTONE: Production launch, 20 advisors, $500M AUM
```

### Phase 3: Advanced (Months 13-24)

```
Month 13-16: Tax Intelligence
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Tax-optimized rebalancing engine
• Tax return OCR (1040 → opportunities)
• Tax-loss harvesting automation

Month 17-20: UHNW Capabilities
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Business entity modeling
• Estate planning module
• Alternative investment support
• Multi-generational projections

Month 21-24: Platform Maturity
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Embedded Tableau analytics
• Factor risk decomposition (advanced)
• Stress testing module
• Open API for third-party tools
• AI-powered plan generation from conversations

MILESTONE: 100 advisors, $2B AUM, full-spectrum capabilities
```

---

## 9. Resource Requirements & Budget {#resources}

### Engineering Team

**Phase 1 (Months 1-6):**

| Role | Count | Annual Cost (loaded) |
|------|-------|---------------------|
| Tech Lead / Architect | 1 | $250K |
| Senior Backend Engineer (TypeScript/Bun) | 2 | $400K |
| Senior Frontend Engineer (React/TS) | 2 | $380K |
| Quantitative Engineer | 1 | $220K |
| Data Engineer | 1 | $200K |
| QA Engineer | 1 | $170K |
| Product Designer | 1 | $180K |
| **Subtotal (9 FTEs)** | | **$1.8M/year** |

**Phase 1 cost (6 months):** ~$900K

**Phase 2 adds (Months 7-12):**

| Role | Count | Annual Cost (loaded) |
|------|-------|---------------------|
| AI/ML Engineer | 1 | $250K |
| Security Engineer | 1 | $200K |
| Compliance Analyst | 1 | $150K |
| **Additional subtotal** | | **$600K/year** |

**Phase 2 cost (6 months):** ~$300K additional

### Infrastructure Budget

| Expense | Monthly (Phase 1) | Monthly (Phase 2) | Annual Total |
|---------|-------------------|-------------------|--------------|
| AWS compute/storage | $3K | $8K | $66K |
| CockroachDB Cloud | $2K | $5K | $42K |
| Aurora PostgreSQL | $1K | $3K | $24K |
| n8n (self-hosted) | $500 | $500 | $6K |
| Financial data APIs | $0 | $5K | $30K |
| Monitoring (Datadog) | $500 | $1K | $9K |
| SOC 2 audit | — | — | $50K |
| Miscellaneous | $1K | $2K | $18K |
| **Total** | **$8K/mo** | **$24.5K/mo** | **$245K** |

### Year 1 Total Budget

| Category | Cost |
|----------|------|
| Engineering (9 FTEs × 6 months + 12 FTEs × 6 months) | $1.2M |
| Infrastructure + APIs | $245K |
| SOC 2 audit + compliance consulting | $80K |
| Product design (tooling, research) | $25K |
| **Total Year 1** | **~$1.55M** |

---

## 10. Success Metrics {#metrics}

### North Star Metric

**Advisor Time-to-Value:** Time from first prospect contact to fully onboarded client with signed IPS.

- **Current industry:** 2-4 weeks
- **Target (Month 6):** <48 hours
- **Target (Month 12):** <24 hours

### Adoption Metrics

| KPI | 6-Month Target | 12-Month Target |
|-----|----------------|-----------------|
| Active advisors | 10 | 50 |
| Total clients on platform | 500 | 5,000 |
| AUM on platform | $200M | $1B |
| Risk assessments/month | 50 | 500 |
| Proposals generated/month | 30 | 300 |

### Experience Metrics

| KPI | 6-Month Target | 12-Month Target |
|-----|----------------|-----------------|
| Advisor NPS | >50 | >70 |
| Client NPS | >60 | >75 |
| Questionnaire completion rate | >80% | >90% |
| Client portal monthly login rate | N/A | >60% |

### Operational Metrics

| KPI | 6-Month Target | 12-Month Target |
|-----|----------------|-----------------|
| Quarterly review cycle time | <1 week | <3 days |
| IPS coverage (% of clients) | >95% | >99% |
| Compliance document retrieval time | <1 hour | <15 minutes |
| Platform uptime | >99.5% | >99.9% |

### Business Impact

| KPI | 12-Month Target | 24-Month Target |
|-----|-----------------|-----------------|
| Advisor retention rate | >95% | >97% |
| Client retention rate | >93% | >95% |
| Revenue per advisor | +15% | +30% |
| New client conversion rate | +20% | +40% |

---

## 11. Risk Register {#risks}

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| **Monte Carlo performance insufficient** (<2s target) | Medium | High | Prototype early; fall back to pre-computation if needed |
| **CockroachDB latency issues** (multi-region) | Low | High | Performance testing in Month 1; Aurora fallback for hot queries |
| **OCR accuracy for statement scanning** | Medium | Medium | Use commercial OCR API (e.g., Textract) vs. open-source; manual fallback |
| **LLM hallucination in NL queries** | Medium | High | SQL generation → human review before execution; constraint validation |

### Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| **Slow advisor adoption** | Medium | High | Beta program with 5 champion advisors; iterate on feedback |
| **StratiFi/Nitrogen competitive response** | High | Medium | Speed to market; focus on integration advantages they can't replicate |
| **Regulatory change** (SEC rule updates) | Low | Medium | Compliance analyst monitors regulatory landscape; modular rule engine |
| **Key person risk** (quant engineer departure) | Low | High | Document models thoroughly; pair programming; knowledge sharing |

### Compliance Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| **SEC examination before SOC 2 complete** | Low | High | Prioritize audit trail implementation (Month 1); SOC 2 readiness by Month 3 |
| **Marketing Rule violation in projections** | Medium | High | Auto-inject disclaimers; compliance review gate before any client-facing content |
| **Data breach / unauthorized access** | Low | Critical | Encryption at rest/transit; RBAC; quarterly pen tests; incident response plan |

---

## Appendix A: Supporting Research Documents

| Document | Location | Size |
|----------|----------|------|
| Competitive Analysis | `research/competitive-analysis.md` | 14.9 KB |
| Technical Architecture | `research/technical-architecture.md` | 23.9 KB |
| Quantitative Models | `research/quantitative-models.md` | 20.1 KB |
| Compliance Requirements | `research/compliance-requirements.md` | 26.5 KB |
| Product Requirements | `research/product-requirements.md` | 25.3 KB |

---

## Appendix B: Technology Resource Guide

See `FARTHER-TECHNOLOGY-TEAM-RESOURCE-GUIDE.md` for 73+ verified training resources across all departments.

---

## Appendix C: Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Feb 22, 2026 | Ledger | Initial PRD — competitive analysis, architecture, models, compliance, product requirements |

---

**Next Review:** March 8, 2026  
**Distribution:** Tim Bohnett (MD), Engineering Leadership, Compliance  
**Questions:** Contact Ledger via OpenClaw

---

*"We don't build tools. We build intelligence systems that make advisors superhuman and clients feel known."*
