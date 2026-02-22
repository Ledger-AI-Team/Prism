# Product Requirements: Farther Risk Assessment & Planning Platform
**Version:** 1.0  
**Date:** February 22, 2026  
**Author:** Ledger (Farther Technology Team)

---

## Executive Summary

This document defines the product requirements for Farther's risk assessment and wealth planning platform — designed to deliver the "it knows you" experience from first prospect meeting through multi-generational wealth management.

**Product Vision:**
> The advisor opens a client profile and everything is already there — risk DNA, portfolio health, tax opportunities, compliance status, next-best-action. No context switching. No re-entering data. Intelligence that feels like intuition.

**Target Users:**
- Advisors (solo RIA → 500+ advisor enterprise)
- Clients (mass affluent $500K → UHNW $500M)
- Compliance officers
- Firm management

---

## 1. User Personas

### Persona 1: Sarah — Solo RIA Advisor (15 clients)

**Profile:**
- Age 38, CFP®, launched independent RIA 3 years ago
- AUM: $45M across 15 households ($500K–$8M each)
- Tech-savvy but time-constrained (no admin staff)
- Currently uses: Riskalyze (risk), MoneyGuidePro (planning), Excel (proposals)

**Pain Points:**
- Wastes 3-4 hours per new client re-entering data across three platforms
- Can't proactively monitor all 15 clients for drift or behavioral triggers
- Compliance documentation is manual (generates IPS separately, logs suitability in Word docs)
- Proposals look generic (same PDF template for $500K and $8M clients)

**Success Metric:** Reduce new client onboarding from 2 weeks to 2 days.

---

### Persona 2: Marcus — Enterprise Advisor (200 clients)

**Profile:**
- Age 52, CFA, senior advisor at 40-person RIA
- AUM: $350M across 200 households ($500K–$50M)
- Has 2 paraplanners and 1 CSA
- Currently uses: StratiFi (risk), eMoney (planning), Salesforce (CRM), Orion (portfolio management)

**Pain Points:**
- "Tool fatigue" — 6 different logins, none talk to each other
- Can't answer "which clients should I call today?" without manually checking multiple systems
- Quarterly reviews take 3 weeks to complete for 200 clients
- Compliance team demands documentation he doesn't have time to produce

**Success Metric:** Reduce quarterly review cycle from 3 weeks to 3 days (automated reviews for 80% of clients, manual only for flagged accounts).

---

### Persona 3: Jennifer & Robert — Mass Affluent Clients ($1.2M household)

**Profile:**
- Both 55, dual income ($250K combined), planning for retirement in 10 years
- $1.2M in 401(k)s, IRAs, taxable brokerage
- Moderate risk tolerance but anxious about market drops
- Want to understand "are we going to be okay?"

**Pain Points:**
- Current advisor shows them a "Risk Number" they don't understand
- Financial plan is a 40-page PDF they never read
- When market drops, they panic-call because no one reached out proactively
- Don't know if they should do Roth conversions or when to take Social Security

**Success Metric:** Interactive portal where they can see probability of retirement success, explore "what if" scenarios, and receive proactive communications before they need to ask.

---

### Persona 4: David & Catherine — UHNW Clients ($85M household)

**Profile:**
- Ages 62/58, business owner (manufacturing company worth $50M), $35M liquid portfolio
- Complex: trusts, family limited partnership, charitable foundation, concentrated stock position
- Need multi-generational planning (2 adult children, 4 grandchildren)
- Concerned about estate taxes, business succession, philanthropic legacy

**Pain Points:**
- Current planning tool (eMoney) doesn't model business entities well
- No unified view of illiquid assets (PE, real estate) alongside liquid portfolio
- Estate planning is done in a separate tool by a separate attorney
- Want "what if I sell the business in 2028 vs. 2030?" scenario modeling

**Success Metric:** Single dashboard showing entire household wealth (liquid + illiquid + business + trusts), with scenario modeling for business sale, estate transfer, and multi-generational impact.

---

### Persona 5: Lisa — Chief Compliance Officer

**Profile:**
- Age 45, JD, CCO at 40-person RIA
- Responsible for regulatory compliance across all advisors
- Currently: Manually reviews sample of client files quarterly, uses Excel to track IPS status

**Pain Points:**
- Can't verify that all 3,000 clients have current IPS (manually spot-checks 50/quarter)
- When SEC examiner asks for records, it takes days to gather documentation
- No real-time visibility into whether advisors are following suitability procedures
- Spends 60% of time on paperwork, 40% on actual compliance analysis

**Success Metric:** Real-time compliance dashboard showing IPS coverage, suitability documentation completeness, and risk assessment currency across all clients. SEC examination responses in <1 hour.

---

## 2. User Workflows

### Workflow 1: New Prospect → Onboarded Client

**Current State (industry average):** 2-4 weeks

**Target State:** <48 hours

```
STEP 1: INITIAL CONTACT (Day 0)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Trigger: Prospect enters via HubSpot (website form, referral, event)
→ System auto-creates client record in Farther
→ Sends prospect welcome email with link to risk questionnaire
→ Advisor receives notification: "New prospect assigned"

STEP 2: RISK ASSESSMENT (Day 0-1)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Prospect completes online questionnaire (5-8 minutes):
- Behavioral questions (loss aversion, volatility tolerance)
- Capacity questions (wealth, income, expenses, time horizon)
→ System calculates risk profile (willingness + capacity scores)
→ System flags mismatches (e.g., high willingness but low capacity)
→ Results available in advisor dashboard BEFORE first meeting

STEP 3: STATEMENT SCANNING (Day 0-1)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Prospect uploads current statements (PDF, CSV, or photo)
→ OCR extracts: positions, cost basis, account types
→ System auto-populates portfolio holdings
→ System runs initial risk analysis on current portfolio
→ Identifies gaps: "Current portfolio risk (78) exceeds your tolerance (55)"

STEP 4: FIRST MEETING (Day 1-2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Advisor has FULL context before meeting:
- Risk profile (behavioral + capacity)
- Current portfolio analysis (holdings, risk, concentration)
- Gaps between current allocation and recommended allocation
- Tax opportunities (if tax return was uploaded)

Meeting produces:
→ Refined risk profile (advisor adjusts based on conversation)
→ Client goals documented (retirement, education, legacy)
→ Meeting notes auto-captured (AI transcription → plan data)

STEP 5: PROPOSAL GENERATION (Day 1-2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
System auto-generates proposal:
- Current vs. proposed portfolio comparison
- Monte Carlo projections (success probability for each goal)
- Fee transparency (current costs vs. Farther costs)
- Tax transition analysis (cost of moving from current to proposed)
- Compliance disclosures (auto-injected)

Advisor reviews and customizes → Sends to client digitally

STEP 6: IPS & ONBOARDING (Day 2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Client accepts proposal:
→ IPS auto-generated from risk profile + proposal data
→ Client e-signs IPS digitally
→ Account transfer initiated (ACAT or direct)
→ Compliance audit trail: complete documentation from first contact through signed IPS

TOTAL: 48 hours or less
```

**Automation Points:**
- HubSpot → Farther client creation (n8n webhook)
- OCR statement scanning (Bun service with Tesseract.js or third-party OCR API)
- Risk calculation (automatic on questionnaire completion)
- Proposal generation (template + data merge)
- IPS generation (template + risk profile + proposal data)
- Compliance logging (automatic on every step)

---

### Workflow 2: Ongoing Client Monitoring & Reviews

**Current State:** Quarterly batch reviews (3 weeks for 200 clients)

**Target State:** Continuous monitoring + automated reviews (advisor reviews only flagged accounts)

```
CONTINUOUS MONITORING
━━━━━━━━━━━━━━━━━━━━
Every 15 minutes:
→ Check market events against client risk profiles
→ Flag clients where behavioral triggers are likely
   (e.g., NASDAQ down 5% + client has >20% tech + high loss aversion)
→ Generate advisor alerts with suggested talking points

Daily:
→ Update portfolio values from custodian feeds
→ Calculate drift from target allocation
→ Flag clients exceeding drift threshold (>5%)
→ Identify tax-loss harvesting opportunities

QUARTERLY REVIEW (automated for 80% of clients)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
System auto-generates quarterly review for each client:
→ Performance summary (net of fees, vs. benchmark)
→ Risk profile status (any changes?)
→ Drift analysis
→ Tax opportunities
→ Goals progress (on track / off track)

Classification:
- GREEN: On track, no drift, no risk changes → Auto-send review summary to client
- YELLOW: Minor drift or approaching life milestone → Advisor reviews and personalizes
- RED: Significant drift, risk mismatch, or market event → Advisor schedules meeting

Advisor time per quarter:
- 200 clients × 80% green = 160 auto-reviews (0 advisor minutes)
- 200 clients × 15% yellow = 30 advisor reviews (15 min each = 7.5 hours)
- 200 clients × 5% red = 10 meetings (30 min each = 5 hours)
- TOTAL: 12.5 hours (vs. 120+ hours in current state)
```

---

### Workflow 3: Portfolio Rebalancing

```
TRIGGER: Drift detected (>5% from target)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

System generates rebalancing proposal:
→ Trades needed to return to target allocation
→ Tax-optimized routing:
   • Sell losers in taxable (harvest losses)
   • Sell winners in IRA (no tax impact)
   • Buy in Roth (tax-free growth)
→ Estimated tax impact
→ Compliance documentation (why this rebalance is appropriate)

Advisor reviews:
→ Approve → System executes via custodian API
→ Modify → Adjust trades → Re-check compliance → Execute
→ Reject → Log reason → Schedule client meeting

Post-execution:
→ Confirmation sent to client
→ Trade log stored in audit trail
→ Updated portfolio values reflected in real-time
```

---

## 3. Key User Stories

### Risk Assessment

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| RA-01 | As an advisor, I want to see a client's risk profile before the first meeting | Risk questionnaire completed → behavioral + capacity scores visible in dashboard |
| RA-02 | As a client, I want to complete a risk questionnaire in <8 minutes | Questionnaire is 12-15 questions; mobile-responsive; progress bar shown |
| RA-03 | As an advisor, I want to see the GAP between current portfolio risk and client tolerance | Gap displayed as visual bar chart: "Portfolio risk: 78 / Client tolerance: 55" |
| RA-04 | As a compliance officer, I want every risk assessment logged with timestamp and user | Immutable audit log entry created on assessment completion |
| RA-05 | As an advisor, I want to override AI-generated risk scores with my professional judgment | Override allowed; reason required; both AI and advisor scores stored |

### Monte Carlo Projections

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| MC-01 | As a client, I want to see my probability of retirement success | Monte Carlo result displayed: "82% chance of meeting your $80K/year retirement goal" |
| MC-02 | As a client, I want to explore "what if" scenarios | Interactive sliders: retirement age, spending, contributions → real-time probability update |
| MC-03 | As an advisor, I want projections to include required disclaimers | Disclosures auto-injected (SEC Marketing Rule compliant) |
| MC-04 | As an advisor, I want both optimistic and pessimistic outcomes shown | 5th percentile (bad), median, and 95th percentile (good) outcomes displayed |

### Proposals

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| PR-01 | As an advisor, I want to generate a proposal in <5 minutes | Auto-populated from risk profile + portfolio data; advisor reviews/tweaks |
| PR-02 | As a client, I want to see current vs. proposed allocation side-by-side | Visual comparison: pie charts, risk scores, projected outcomes |
| PR-03 | As an advisor, I want fee transparency included automatically | Current total cost vs. Farther total cost displayed prominently |
| PR-04 | As a compliance officer, I want Reg BI disclosures in every proposal | Conflict disclosures, fee transparency, alternatives considered — auto-included |

### Proactive Monitoring

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| PM-01 | As an advisor, I want to be alerted when a client is likely to panic | Behavioral trigger alert: "Client X has high loss aversion + tech-heavy portfolio + NASDAQ down 5%. Suggested action: proactive call" |
| PM-02 | As an advisor, I want to know which clients to call TODAY | Priority inbox showing: red (urgent), yellow (review needed), green (on track) |
| PM-03 | As a client, I want my advisor to reach out before I need to call them | System triggers advisor outreach when behavioral + market signals align |

### Compliance

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| CO-01 | As a CCO, I want a dashboard showing IPS coverage across all clients | Real-time metric: "2,847/3,000 clients have current IPS (94.9%)" |
| CO-02 | As a CCO, I want to produce any client document within 1 hour for SEC examination | Search by client → retrieve all documents (IPS, proposals, risk assessments, communications) |
| CO-03 | As a CCO, I want automated alerts when compliance gaps are detected | Alert: "12 clients have risk assessments >12 months old. List attached." |

---

## 4. Feature Specifications

### Phase 1: MVP (Months 1-6)

**Goal:** Core risk assessment + proposal generation + compliance logging

| Feature | Priority | Description |
|---------|----------|-------------|
| **Risk Questionnaire** | P0 | 12-15 question behavioral + capacity assessment; mobile-responsive |
| **Risk Scoring Engine** | P0 | Prospect Theory (willingness) + Arrow-Pratt (capacity) → composite score |
| **Portfolio Ingestion** | P0 | CSV/PDF upload → OCR extraction → holdings database |
| **Gap Analysis** | P0 | Current portfolio risk vs. client tolerance visualization |
| **Monte Carlo Projections** | P0 | 10,000 simulations; success probability; percentile outcomes |
| **Proposal Generator** | P0 | Current vs. proposed; fee comparison; disclosures auto-included |
| **IPS Generator** | P0 | Auto-populated from risk profile + proposal; e-signature |
| **Compliance Audit Log** | P0 | Immutable logging of every action; 7-year retention |
| **HubSpot Integration** | P1 | New leads sync; activity logging; task creation |
| **Advisor Dashboard** | P1 | Client list with risk scores, AUM, last review date |

**MVP Success Criteria:**
- New client onboarding <48 hours
- Proposal generation <5 minutes
- 100% compliance documentation coverage

---

### Phase 2: Intelligence Layer (Months 7-12)

**Goal:** Proactive monitoring + AI insights + client portal

| Feature | Priority | Description |
|---------|----------|-------------|
| **Continuous Risk Monitoring** | P0 | 15-minute market event → risk profile cross-reference |
| **Proactive Alert Engine** | P0 | Behavioral trigger detection → advisor notification |
| **Natural Language Queries** | P1 | "Show clients with >20% tech concentration" → results |
| **Client Portal** | P1 | Risk profile, goals progress, Monte Carlo visualization |
| **Interactive "What If" Scenarios** | P1 | Client-facing sliders: retirement age, spending, contributions |
| **Automated Quarterly Reviews** | P1 | Auto-generate reviews; classify green/yellow/red |
| **Tax-Loss Harvesting Alerts** | P2 | Daily scan for harvesting opportunities across all clients |
| **Compliance Dashboard** | P1 | IPS coverage, suitability gaps, audit readiness metrics |

**Phase 2 Success Criteria:**
- Advisors contact at-risk clients before they call
- Quarterly review cycle <3 days (vs. 3 weeks)
- Compliance dashboard: real-time visibility across all clients

---

### Phase 3: Advanced Features (Months 13-24)

**Goal:** Tax optimization + UHNW capabilities + embedded analytics

| Feature | Priority | Description |
|---------|----------|-------------|
| **Tax-Optimized Rebalancing** | P0 | Cross-account trade routing for household tax efficiency |
| **Tax Return OCR** | P1 | Upload 1040 → auto-identify Roth conversion, bracket, IRMAA opportunities |
| **Business Entity Modeling** | P1 | UHNW: model business value, cash flows, sale/succession scenarios |
| **Estate Planning Module** | P2 | Trust modeling, gifting strategies, multi-generational projections |
| **Alternative Investment Support** | P2 | PE, hedge funds, real estate in portfolio + risk analysis |
| **Embedded Tableau Dashboards** | P1 | Firm-level analytics embedded in advisor workspace |
| **Factor Risk Decomposition** | P1 | Fama-French + custom factors (sector, geographic, liquidity) |
| **Stress Testing Module** | P2 | Historical + hypothetical scenarios with client-specific impact |

**Phase 3 Success Criteria:**
- Tax-optimized rebalancing saves clients measurable tax dollars
- UHNW clients ($10M+) fully served without platform switching
- Firm management has real-time visibility into book of business health

---

## 5. Integration Requirements

### Required Integrations (Phase 1)

| System | Direction | Data Flow | Method |
|--------|-----------|-----------|--------|
| **HubSpot CRM** | Bidirectional | Contacts, deals, activities | REST API + n8n |
| **Schwab Advisor Services** | Inbound | Positions, trades, cost basis | SFTP (daily files) |
| **Fidelity Institutional** | Inbound | Positions, trades, cost basis | SFTP (daily files) |
| **DocuSign** | Outbound | IPS, proposals for e-signature | REST API |

### Phase 2 Integrations

| System | Direction | Data Flow | Method |
|--------|-----------|-----------|--------|
| **Bloomberg** | Inbound | Security master, pricing, factor data | BPIPE / REST API |
| **FactSet** | Inbound | Fundamental data, risk analytics | REST API |
| **Morningstar** | Inbound | Fund data, investment research | REST API |
| **Tableau** | Outbound | Analytics datasets | Embedded via JavaScript API |

### Phase 3 Integrations

| System | Direction | Data Flow | Method |
|--------|-----------|-----------|--------|
| **Schwab Trading API** | Outbound | Automated trade execution | REST API |
| **Holistiplan** | Bidirectional | Tax data, scenario results | REST API |
| **Orion** | Bidirectional | Portfolio management, performance | REST API |

---

## 6. Client-Facing Experience Design Principles

### Design System

**Visual Identity:**
- Clean, modern, fintech-grade (think Betterment/Wealthfront aesthetic)
- Data-dense without feeling overwhelming
- Progressive disclosure (show summary → drill into detail on click)

**Color Palette:**
- Primary: Deep blue (#1a365d) — trust, stability
- Accent: Gold (#d69e2e) — premium, success
- Risk indicators: Green → Yellow → Red (intuitive)
- Backgrounds: Light gray (#f7fafc) — clean, breathable

**Typography:**
- Headers: Inter (modern, geometric, excellent readability)
- Body: Inter or system fonts (fast loading)
- Numbers: Tabular numerals (aligned decimal points in tables)

### Data Visualization Standards

**Risk Score:**
- Semicircular gauge: 0 (conservative) → 100 (aggressive)
- Color gradient: green (low) → yellow (moderate) → red (high)
- Both willingness AND capacity shown side-by-side
- Gap highlighted if mismatch exists

**Monte Carlo:**
- Fan chart showing probability ranges over time
- Thick line for median, shaded bands for 25th-75th and 5th-95th percentiles
- Goal line clearly marked ("You need $2M for retirement")
- Interactive: hover for specific year projections

**Portfolio Allocation:**
- Donut chart for asset class breakdown (not pie — center shows total value)
- Stacked bar for sector/geographic concentration
- Before/after comparison for proposals

**Client Communication:**
- No jargon (replace "VaR" with "Maximum expected loss in a bad month")
- Use concrete dollar amounts, not just percentages
- "Your portfolio could lose up to $47,000 in a bad month" > "95% VaR is 4.7%"

### Accessibility Requirements
- WCAG 2.1 AA compliance
- Color-blind friendly (don't rely solely on color; use patterns/labels)
- Screen reader compatible
- Keyboard navigation for all interactions
- Minimum font size: 14px body, 12px captions

### Mobile Responsiveness
- Client portal: fully responsive (designed mobile-first)
- Advisor dashboard: responsive but optimized for desktop (most advisors use 2+ monitors)
- Critical actions (approve rebalance, view alert) available on mobile

---

## 7. Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Risk assessment calculation** | <2 seconds | From questionnaire submission to results display |
| **Monte Carlo (10K simulations)** | <2 seconds | Single portfolio |
| **Proposal generation** | <10 seconds | Including PDF rendering |
| **Dashboard load** | <3 seconds | Initial load with 200 client list |
| **Search (NL query)** | <5 seconds | Natural language → results |
| **Statement OCR** | <30 seconds | Per statement (1-10 pages) |
| **API latency P95** | <500ms | All REST API endpoints |
| **Uptime** | 99.9% | Monthly measurement |

---

## 8. Success Metrics & KPIs

### Advisor Adoption

| KPI | Target (6 months) | Target (12 months) |
|-----|-------------------|---------------------|
| **Active advisors** | 20 | 100 |
| **Assessments completed/month** | 50 | 500 |
| **Proposals generated/month** | 30 | 300 |
| **Avg. onboarding time** | <48 hours | <24 hours |
| **NPS (advisor)** | >50 | >70 |

### Client Experience

| KPI | Target (6 months) | Target (12 months) |
|-----|-------------------|---------------------|
| **Questionnaire completion rate** | >80% | >90% |
| **Client portal login rate** | >40% monthly | >60% monthly |
| **"What if" scenario usage** | N/A | >30% of clients explore scenarios |
| **NPS (client)** | >60 | >75 |

### Compliance

| KPI | Target (6 months) | Target (12 months) |
|-----|-------------------|---------------------|
| **IPS coverage** | >95% | >99% |
| **Suitability documentation** | 100% | 100% |
| **Document retrieval time** | <1 hour | <15 minutes |
| **Audit findings** | 0 critical | 0 critical |

### Business Impact

| KPI | Target (12 months) | Target (24 months) |
|-----|---------------------|---------------------|
| **AUM growth attributable to platform** | $500M | $2B |
| **Advisor retention** | >95% | >97% |
| **Client retention** | >93% | >95% |
| **Revenue per advisor** | +15% | +30% |

---

## 9. Resource Requirements

### Engineering Team (Phase 1 MVP)

| Role | Count | Focus |
|------|-------|-------|
| **Tech Lead / Architect** | 1 | System design, code review, infrastructure |
| **Senior Backend Engineer** | 2 | Risk engine, API services (TypeScript/Bun) |
| **Senior Frontend Engineer** | 2 | Advisor dashboard, client portal (React/TS) |
| **Quantitative Engineer** | 1 | Monte Carlo, behavioral models, factor decomposition |
| **Data Engineer** | 1 | Custodian feeds, data pipeline, Aurora/CockroachDB |
| **QA Engineer** | 1 | Test automation, compliance verification |

**Total Phase 1:** 8 engineers × 6 months = ~$1.2M (salary + benefits)

### Additional Roles (Phase 2+)

| Role | When | Focus |
|------|------|-------|
| **AI/ML Engineer** | Month 7 | Behavioral prediction models, NLP queries |
| **Security Engineer** | Month 7 | SOC 2 preparation, pen testing |
| **Product Designer** | Month 1 | UX research, wireframes, design system |
| **Compliance Analyst** | Month 1 | Regulatory requirements, audit preparation |

### Infrastructure Costs (Estimated Monthly)

| Service | Month 1-6 | Month 7-12 | Month 13-24 |
|---------|-----------|-----------|-------------|
| **AWS (compute, storage, networking)** | $3K | $8K | $15K |
| **CockroachDB Cloud** | $2K | $5K | $10K |
| **Aurora PostgreSQL** | $1K | $3K | $5K |
| **n8n (self-hosted on AWS)** | $500 | $500 | $1K |
| **Third-party APIs (Bloomberg, FactSet)** | $0 (Phase 1) | $5K | $10K |
| **Monitoring (Datadog)** | $500 | $1K | $2K |
| **Total** | **~$7K/mo** | **~$22.5K/mo** | **~$43K/mo** |

---

## Appendix: Competitive Feature Gap Analysis

| Feature | StratiFi | Nitrogen | RightCapital | eMoney | **Farther (Planned)** |
|---------|----------|---------|-------------|--------|----------------------|
| Behavioral risk (willingness vs. capacity) | ✅ | ❌ | ❌ | ❌ | ✅ |
| Continuous AI monitoring | ✅ | ❌ | ❌ | ❌ | ✅ |
| Embedded in advisor workflow | ❌ | ❌ | ❌ | ❌ | ✅ |
| Tax-optimized rebalancing | ❌ | ❌ | Partial | Partial | ✅ (Phase 3) |
| Natural language queries | ❌ | ❌ | ❌ | ❌ | ✅ (Phase 2) |
| One-click onboarding (<48 hrs) | ❌ | ❌ | ❌ | ❌ | ✅ |
| Real-time compliance dashboard | Partial | ❌ | ❌ | ❌ | ✅ |
| UHNW business entity modeling | ❌ | ❌ | ✅ | Partial | ✅ (Phase 3) |
| Client "what if" scenarios | ❌ | ❌ | ✅ | ✅ | ✅ (Phase 2) |
| Proactive behavioral alerts | ✅ | ❌ | ❌ | ❌ | ✅ |

**Farther's unique differentiator:** Only platform combining behavioral risk intelligence + embedded workflow + tax optimization + real-time compliance in a single system.

---

**End of Product Requirements Document**
