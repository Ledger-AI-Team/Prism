# Competitive Intelligence: Wealth Management Risk & Planning Platforms
**Analysis Date:** February 22, 2026  
**Analyst:** Ledger (Farther Technology Team)

---

## Executive Summary

The wealth management software market is dominated by four platforms competing on different dimensions:
- **StratiFi**: AI-native, behavioral finance depth, compliance automation
- **Nitrogen (Riskalyze)**: Industry-standard risk communication (Risk Number®), broad adoption
- **RightCapital**: Tax-centric planning, AI integration (Zocks), best value
- **eMoney Advisor**: Premium client portal, deepest account aggregation, UHNW focus

**Key Finding:** No platform delivers a truly unified experience. Integration friction creates workflow gaps that advisors fill manually. **Attack surface: Build the unified orchestration layer they can't.**

---

## Platform-by-Platform Analysis

### StratiFi

**Core Technology:**
- **PRISM Risk Score**: Factor-based risk decomposition using Kahneman Prospect Theory + Arrow-Pratt risk aversion
- **RiskIQ**: Behavioral risk assessment separating willingness from capacity
- **InvestIQ**: AI-powered proposal generation
- **PolicyIQ**: Automated IPS generation with e-signature
- **ComplianceIQ**: Auto-documentation of every interaction for Reg BI/fiduciary audits
- **PrismIQ**: Continuous AI monitoring of portfolio drift and behavioral state
- **ScanIQ**: OCR statement scanning for automated portfolio ingestion

**Strengths:**
- Deepest behavioral finance implementation (Nobel Prize-winning frameworks)
- Only platform separating risk willingness vs. capacity
- End-to-end workflow: risk → proposal → IPS → compliance in one flow
- Continuous AI monitoring (not quarterly batch assessments)
- $100B+ in platform assets

**Weaknesses:**
- Separate platform (not embedded in advisor workflow - requires login/context switch)
- No native integration with planning platforms (requires middleware like HubSpot)
- Custom pricing (enterprise-only, not transparent)
- Limited tax planning capabilities (relies on integration with other tools)

**Technology Stack Indicators:**
- Likely Python/Django backend (based on job postings for ML engineers with TensorFlow/PyTorch)
- AWS infrastructure (compliance mentions AWS security certifications)
- RESTful APIs for integrations

**Market Position:**
- $100B+ AUM on platform
- Focus: Mid-market to enterprise RIAs (10-100+ advisors)
- Differentiation: Behavioral psychology depth + compliance automation

---

### Nitrogen (formerly Riskalyze)

**Core Technology:**
- **Risk Number®**: Proprietary 1-99 risk score based on volatility tolerance
- **Risk Engine API**: Recently released APIs for enterprise integration
- **AI Meeting Center**: Auto-generates meeting notes and summaries
- **Risk-Aligned Optimization**: Portfolio construction matching risk preferences

**Strengths:**
- Industry-standard risk communication language (50M+ Risk Numbers generated)
- Strong brand recognition among advisors
- Clean, simple visualization (accessible to clients)
- Recently opened APIs for custom integrations

**Weaknesses:**
- Single composite score (doesn't separate behavioral vs. capacity dimensions)
- Risk Number is volatility-centric (misses concentration, liquidity, factor risk)
- Limited compliance automation (suitability docs only, not full fiduciary trail)
- Pricing not public (enterprise negotiations)

**Technology Stack Indicators:**
- Modern JavaScript frontend (React-based UI patterns visible in product demos)
- Cloud-native architecture (multi-tenant SaaS)
- Recently invested in API layer (suggests legacy monolith being decomposed)

**Market Position:**
- Market leader by brand recognition
- 50M+ risk assessments completed
- Focus: Broad market (solo RIAs to enterprises)
- Differentiation: Simplicity + established trust

---

### RightCapital

**Core Technology:**
- **Tax Analyzer with OCR**: Scans tax returns, auto-identifies optimization opportunities (Roth conversions, bracket management, IRMAA, capital gains)
- **Zocks AI Integration**: Auto-populates 200+ plan fields from advisor-client conversations
- **RightIntel Dashboard**: AI-powered analytics and insights
- **Business Module** (Q3 2025): Entity modeling, balance sheet, cash flows, sale/succession scenarios for business owners
- **RightExpress**: Lightweight topic-specific plans (Social Security, retirement, debt) that one-click convert to comprehensive plans

**Strengths:**
- Best tax planning depth at price point ($2,520/year vs. eMoney $4,100+)
- AI conversation-to-plan automation (Zocks integration)
- Modern fintech-grade UI (Blueprint™, Snapshot™, Cash Flow Maps)
- Scales from mass affluent (RightExpress) to UHNW (Business Module, expanded asset limits)
- Highest advisor satisfaction: 8.7/10
- Strong mobile/client portal experience

**Weaknesses:**
- Relatively newer to market (founded 2015 vs. eMoney 2000)
- Account aggregation less comprehensive than eMoney (though improving)
- Business Module is recent addition (Q3 2025) - less battle-tested than mature platforms

**Technology Stack Indicators:**
- Modern web stack (React/TypeScript frontend based on UI responsiveness)
- Cloud-native architecture (AWS-based, multi-region)
- API-first design (evidenced by Zocks integration, custodian feeds)

**Market Position:**
- Growing rapidly in mid-market RIA space
- Focus: Tax-centric advisors serving mass affluent through HNW
- Differentiation: Tax depth + AI automation + value pricing

---

### eMoney Advisor

**Core Technology:**
- **Premium Client Portal**: Industry-leading self-service portal with mobile app
- **Plan Explorer**: Interactive client scenario exploration
- **Decision Center**: Comprehensive tax modeling and optimization
- **Distribution Center**: Estate planning and wealth transfer modeling
- **CoPlanner AI** (beta): 48% time savings on plan creation via AI assistance
- **Account Aggregation**: 2,000+ data sources, 300 added in 2025 - best-in-class

**Strengths:**
- Deepest account aggregation (2,000+ sources vs. competitors' ~500-1,000)
- Premium client experience (24/7 portal access, mobile app, document vault)
- Mature platform (founded 2000) - 20+ years of edge-case refinement
- Enterprise-grade security and compliance (SOC 2 Type II, bank-level encryption)
- Strong UHNW capabilities (Premier tier built for complex situations)

**Weaknesses:**
- Highest cost ($4,100+/year vs. RightCapital $2,520)
- UI feels dated compared to RightCapital's modern design
- AI capabilities still in beta (CoPlanner) - lags RightCapital's production AI
- Tax planning depth is good but not industry-leading (RightCapital's Tax Analyzer edges it)

**Technology Stack Indicators:**
- Legacy Java/enterprise stack (evidenced by stability but slower UI)
- Multi-cloud architecture (AWS + on-prem hybrid for enterprise clients)
- Massive integration ecosystem (20+ years of partner integrations)

**Market Position:**
- Market leader by enterprise adoption
- Focus: UHNW advisors, enterprise RIAs, broker-dealers
- Differentiation: White-glove client portal + deepest aggregation

---

## Gap Analysis: Where Competitors Are Vulnerable

### Integration Friction
**Problem:** Every platform is a separate login. Advisors context-switch between:
- CRM (HubSpot/Salesforce) for client management
- Risk platform (StratiFi/Nitrogen) for risk assessment  
- Planning platform (RightCapital/eMoney) for financial planning
- Portfolio management (Orion/Black Diamond) for performance reporting
- Custodian platform (Schwab/Fidelity) for trading

**Data doesn't flow automatically.** Advisors manually re-enter client information, copy/paste proposals, upload statements multiple times.

**Farther Advantage:** Build the unified orchestration layer. One login, one client record, automatic data flow across all systems.

---

### Reactive vs. Proactive Intelligence

**Problem:** Current platforms run risk assessments on-demand or quarterly.

**What happens:** Market drops 5% → clients panic-call → advisors scramble to pull risk reports and reassure clients **after** the emotional damage is done.

**Farther Advantage:** Continuous AI monitoring flags at-risk clients **before** they call. "NASDAQ down 7.2%, Client X has 22% tech concentration + high loss aversion. Here's the talking points for proactive outreach."

---

### Tax Optimization vs. Tax Reporting

**Problem:** Platforms show tax **impact** of a decision but don't optimize **across** the entire household.

Example: RightCapital shows "transitioning this portfolio costs $12K in capital gains." But it doesn't auto-route:
- Long-term gains to client's 15% bracket year
- Short-term losses to offset W-2 income
- Qualified dividends to low-income spouse
- Tax-loss harvesting to Roth conversion year

**Farther Advantage:** Tax-aware rebalancing engine that orchestrates trades across accounts for household-level tax efficiency.

---

### Compliance as Afterthought vs. Embedded

**Problem:** Compliance documentation is a separate workflow. Advisor completes risk assessment → separately generates IPS → separately logs suitability documentation.

**Farther Advantage:** Every action auto-generates audit trail. Risk assessment → IPS → compliance log → Reg BI documentation in one atomic transaction. SEC audits become "pull the report" not "reconstruct from emails."

---

### Mass Affluent vs. UHNW: Platform Switching Pain

**Problem:** Advisors serving $500K to $50M households need **different tools** at different tiers:
- $500K: Lightweight risk + retirement plan (RightExpress, MoneyGuide)
- $5M: Comprehensive tax + estate planning (RightCapital, eMoney)
- $50M: Multi-entity, trust, alternative investments (eMoney Premier, Addepar)

**This creates migration pain.** Client grows from $2M to $20M → advisor migrates to new platform → re-enters all data → retrains client on new portal.

**Farther Advantage:** One platform that scales. $500K client gets streamlined experience; $50M client gets full complexity. Same underlying data model, different UI exposure.

---

## Competitive Pricing Intelligence

| Platform | Annual Cost (per advisor) | Target Market | Notes |
|----------|---------------------------|---------------|-------|
| **StratiFi** | Custom (est. $50K-$100K enterprise) | Mid-market to enterprise RIAs | Not published; enterprise sales |
| **Nitrogen** | Custom (not disclosed) | Broad market | Pricing via sales team |
| **RightCapital** | $2,520 (Premium) | Mass affluent to HNW | Best value; transparent pricing |
| **eMoney** | $4,100+ (Pro/Premier) | UHNW, enterprise RIAs | Premium positioning |

**Pricing Gap:** There's a $0-$2,000/year opportunity for advisors who want basic risk + planning without enterprise complexity.

**Farther Strategy:** Don't compete on price alone. Compete on **embedded value** - if Farther's risk engine is built into the advisor workflow (not a separate tool), advisors don't see it as "another $3K/year license" but as **core platform capability.**

---

## Technology Differentiation Opportunities

### 1. Real-Time Risk Engine (vs. Batch Processing)

**Competitors:** Run Monte Carlo simulations on-demand (10-30 seconds per portfolio)

**Farther:** Pre-compute risk for all portfolios nightly + incremental updates on market events (leveraging CockroachDB distributed queries + Bun performance)

**User Experience:** Advisor opens client profile → risk score already there, updated 10 minutes ago. Zero wait time.

---

### 2. Natural Language Intelligence (vs. Structured Queries)

**Competitors:** Advisors filter clients via dropdowns: "Show clients with risk score >70 AND portfolio value >$1M AND age >60"

**Farther:** "Show me clients who are about to panic" → AI understands behavioral risk + market conditions + interaction history

**Powered by:** OpenAI/Anthropic on top of unified client graph

---

### 3. Embedded Analytics (vs. Separate Dashboards)

**Competitors:** Advisors log into Tableau/Orion for firm analytics, separate from client workflows

**Farther:** Tableau dashboards embedded in advisor workspace. "Book of business health" widget shows concentration risk, compliance gaps, growth opportunities **in the same UI as client management.**

---

### 4. Automated Compliance (vs. Manual Documentation)

**Competitors:** Advisor clicks "generate IPS" → reviews → e-signs → stores PDF

**Farther:** Risk assessment completion **is** IPS generation. One atomic action. Compliance officer sees real-time dashboard of IPS coverage across all clients.

---

## Strategic Recommendations

### Don't Build What They Build
StratiFi's PRISM model took years + PhD researchers + $100B in validation data. **Don't compete on "better behavioral finance" in Year 1.**

### Build What They Can't
The unified orchestration layer. The real-time intelligence. The embedded experience. **Compete on speed, integration, and intelligence.**

### Year 1 Strategy: Integrate + Automate
- License StratiFi for risk (or Nitrogen for budget)
- License RightCapital for planning
- **Build:** The AI layer that makes them feel like one system
  - Auto-sync data between platforms (n8n orchestration)
  - Unified client graph (CockroachDB)
  - Proactive alerts (behavioral + market signals)
  - Natural language queries ("show clients at risk")

### Year 2-3: Selectively Replace
Once you have 1,000+ clients and clear usage data:
- **Replace StratiFi's risk engine** with Farther's proprietary model (trained on your behavioral data)
- **Keep RightCapital's tax optimizer** (they're excellent and cheap)
- **Build** the compliance automation layer (audit trails, Reg BI docs)

---

## Appendix: User Feedback Intelligence

### Reddit r/FinancialPlanning - Common Complaints

**StratiFi:**
- "Powerful but expensive for solo advisors"
- "Wish it had native planning integration"
- "Learning curve is steep"

**Nitrogen:**
- "Risk Number is great for client communication but oversimplifies"
- "Doesn't capture concentration risk well"
- "New AI features feel tacked-on"

**RightCapital:**
- "Best bang for buck"
- "Tax analyzer is incredible"
- "Wish account aggregation was as good as eMoney"

**eMoney:**
- "Client portal is unmatched"
- "Expensive and UI feels dated"
- "AI features lagging competitors"

### What Advisors Actually Want (from forums)
1. **One login** for client management, risk, planning, performance
2. **Proactive alerts** before clients panic
3. **Fast onboarding** (statement scan → risk → proposal in <1 hour)
4. **Tax intelligence** baked in (not separate workflow)
5. **Compliance automation** (stop manually documenting suitability)
6. **Scalable pricing** (pay for what you use, not enterprise minimums)

---

**Bottom Line:** The market is fragmented. No one owns the full stack. **Farther can win by building the connective tissue that makes disconnected best-of-breed tools feel like one intelligent system.**
