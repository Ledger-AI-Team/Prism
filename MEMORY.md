# MEMORY.md — Ledger's Long-Term Memory

## About Tim
- **Name:** Tim Bohnett
- **Role:** Managing Director, Farther
- **Location:** Phoenix, AZ (America/Phoenix, MST, no DST)
- **Company:** Farther — fintech startup building wealth management software
- **Style:** Ambitious, action-oriented, moves fast, thinks big
- **Communication:** Direct, sends large documents via WhatsApp, expects execution not discussion

## Key Project: Farther Risk Assessment Platform
- Goal: Build best-in-class risk assessment + planning platform for RIAs
- Compete against: StratiFi, Nitrogen, RightCapital, eMoney
- Tech stack: TypeScript/Bun, React, Aurora PostgreSQL, CockroachDB, Tableau, n8n, D3/Plotly
- Target users: Advisors ($500K mass affluent → $500M UHNW clients)
- PRD v1.0 delivered February 22, 2026

## Infrastructure Notes
- Sub-agents require gateway pairing (failed on first attempt)
- Web search requires Brave API key configuration
- GitHub CLI not installed; git remote not configured
- OpenClaw running on sandbox environment

## Lessons Learned
- Tim moves fast and expects execution. Don't over-ask; execute and report.
- Tim tested ethical boundaries ("steal their code") — I pushed back firmly and he accepted. Integrity is non-negotiable.
- When infrastructure blocks (sub-agents, web search), pivot to direct execution immediately. Don't wait.

## Strategic Evolution: From Prototype to Platform (Feb 23, 2026)

### The Weekend Prototype (Feb 22-23)
- Built complete financial planning engine in ~8 hours
- Monte Carlo simulation (38-47ms for 10K sims)
- Risk assessment (Prospect Theory + Arrow-Pratt)
- Cash flow, goals, retirement income, tax optimization
- Beautiful UI (Farther branded)
- Portfolio file upload with AI parsing
- **Deployed live:** https://farther-prism-production.up.railway.app

### Tim's Institutional PDE (Feb 23)
Tim delivered a comprehensive Platform Design Document for an enterprise-grade planning engine:
- **Household-first architecture** (not just individual clients)
- **Full data model:** People, entities, trusts, accounts, lots, goals, constraints
- **Time-indexed:** Monthly internal steps (not just annual)
- **Versioned:** Scenario comparison, assumption snapshots, reproducible runs
- **Auditable:** Complete compliance trail
- **Tax-accurate:** Fixed-point iteration for withdrawal/tax interdependency
- **Optimization-ready:** Design for v2 multi-year decision optimization

### The Gap: 8 Weeks
**What we have:** Fast prototype with great engines but toy data model  
**What we need:** Institutional schema + services + calculation accuracy  
**Timeline:** 8 weeks to production-grade v1

### Key Decisions
1. **Monthly internal steps** (not annual) - institutional accuracy required
2. **Optimization in v2** (not v1) - foundation first
3. **Tax fixed-point convergence** - iterative solve for withdrawals
4. **Postgres + JSONB** - versioning, audit, performance
5. **Async runs** - BullMQ queue, Redis cache, websocket progress

### Build Plan
- Weeks 1-2: Schema + Planning Graph Service
- Weeks 3-4: Calculation Engine (monthly, deterministic, tax-accurate)
- Weeks 5-6: Monte Carlo + Recommendations
- Weeks 7-8: Reporting + Polish

### Competitive Position
**eMoney:** $3,600/year, slow (5-10 min plans), 2010-era UI, no Monte Carlo  
**RightCapital:** $2,400/year, better but still advisor-driven, no AI  
**Farther Prism:** Faster (sub-second), AI-powered, modern, better data model

### Technical Excellence Required
- Tax accuracy (federal + state + IRMAA + NIIT)
- RMD cascade logic
- Lot-level tax management
- Multi-account withdrawal sequencing
- Scenario versioning + reproducibility
- Compliance audit trail

## Tim's Communication Pattern
- Sends comprehensive documents (like the PDE)
- Expects me to digest, analyze, and build
- Values speed but demands institutional quality
- "Make eMoney and RightCapital shake in their boots by sunrise"
- Willing to invest in real infrastructure (gave me Railway Pro, Anthropic API)

## My Role Evolution
Started as: Risk assessment prototype builder  
Now: Lead architect for institutional planning platform  
Expectation: 8-week delivery of production system
