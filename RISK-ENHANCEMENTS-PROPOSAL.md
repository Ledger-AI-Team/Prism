# Risk Assessment Enhancement Proposal
**For:** Farther Compass & Prism  
**Date:** Feb 26, 2026  
**Status:** Research → Spec → Build

---

## 3 Enhancement Ideas (Research-Backed)

---

## **Enhancement 1: Behavioral Composure Score™**
### The "Panic Predictor" — Measure anxiety, not just tolerance

**Problem:**
- Traditional questionnaires ask "How would you react to a 20% drop?" (hypothetical)
- Research shows **affective forecasting is unreliable** — people can't predict their emotional responses
- Advisors get blindsided when clients panic-sell despite "high risk tolerance" scores

**Solution:**
Add **Risk Composure** as a separate dimension (Orion-style, Carr framework)

**What It Measures:**
- Anxiety around volatility (emotional response to market swings)
- Historical behavior during actual downturns (2008, 2020 COVID crash)
- Sleep impact, obsessive checking, panic triggers
- Regret patterns (selling too soon, missing rallies)

**How It Works:**
1. **Memory-based questions** (not hypotheticals):
   - "During March 2020 (COVID crash), did you: (a) sell, (b) hold, (c) buy more, (d) didn't have investments yet?"
   - "How many times per day did you check your portfolio during the last downturn?"
   - "What's a financial decision you regret — acting too quickly or not acting fast enough?"
   
2. **Physiological indicators** (optional, advanced):
   - Heart rate variability during market updates (Apple Watch integration)
   - Trading frequency during volatility windows (account analysis)
   
3. **Composure Score (0-100):**
   - 0-30: **High Anxiety** (likely to panic-sell, needs proactive advisor contact)
   - 31-70: **Moderate Composure** (may struggle but recoverable with guidance)
   - 71-100: **Low Anxiety** (stays calm, may need reminders not to chase returns)

**Implementation:**
- Add 8-10 composure questions to existing questionnaire
- Store `composure_score` in `risk_profiles` table
- Tag clients with composure < 40 in CRM for "high-touch during volatility" alerts
- Train AI to detect composure drift over time (declining scores = intervention needed)

**Competitive Edge:**
- Orion has this, but only for their platform users
- FinaMetrica/Riskalyze don't measure it at all
- **Farther differentiation:** "We predict behavior, not just tolerance"

**Advisor Value:**
- Know *in advance* which clients need hand-holding during crashes
- Proactive outreach before panic calls ("I saw the market drop — here's why your plan is still on track")
- Reduces AUM churn during volatility

**Client Value:**
- Self-awareness: "I know I panic — my advisor is prepared for that"
- Reduces shame/embarrassment around emotional responses
- Builds trust through normalization ("It's OK to feel anxious, here's how we'll handle it together")

---

## **Enhancement 2: Portfolio-Risk Alignment Dashboard**
### "Your Risk Number vs Your Real Risk" — Visual stress testing with actual holdings

**Problem:**
- Clients complete risk questionnaire → get score (e.g., "70/100 risk tolerance")
- But they have NO IDEA if their portfolio matches that score
- Advisors say "you're moderate risk" — but what does that mean in a crash?

**Solution:**
Real-time **alignment gauge** comparing stated risk vs actual portfolio behavior

**Visual Components:**

**1. Risk Alignment Meter:**
```
Stated Risk Tolerance: ████████░░ 80/100 (Aggressive)
Actual Portfolio Risk: ██████░░░░ 60/100 (Moderate-Aggressive)
                       ▼
                   UNDERALLOCATED
                   (Missing 20pts of growth potential)
```

**2. Stress Test Matrix** (using Backblaze historical data):
| Scenario | Your Portfolio | Market (SPY) | Status |
|----------|----------------|--------------|--------|
| 2008 Crisis | -32% | -37% | ✅ Outperformed |
| 2020 COVID | -28% | -34% | ✅ Outperformed |
| 2022 Bear | -18% | -18% | ⚠️ Matched (no protection) |
| Hypothetical 40% Crash | -34% | -40% | 🔴 Still loses $170K |

**3. Gap Analysis with Explanations:**
> **Why the gap?**  
> Your risk tolerance suggests 80% stocks / 20% bonds, but your current allocation is 65% stocks / 30% bonds / 5% cash.  
>  
> **Impact:**  
> - You're leaving ~2.1% annual return on the table  
> - Over 20 years: **$147K in opportunity cost**  
>  
> **Trade-off:**  
> - Lower volatility (max drawdown -32% vs -38%)  
> - Better sleep during crashes (composure score: 42/100)

**4. Rebalancing Preview:**
- Show "before/after" scenario if they close the gap
- Tax impact calculator (realize $12K capital gains → $3K tax hit)
- Time horizon overlay: "You have 18 years to retirement — can afford more risk"

**Implementation:**
- Integrate Compass risk engine with Focus portfolio analysis
- Use Backblaze market data for historical stress tests
- Calculate portfolio beta, VaR, CVaR, max drawdown
- Generate alignment score: `abs(tolerance_score - portfolio_risk_score)`
- API endpoint: `GET /api/v1/risk/alignment/{household_id}`
- UI: D3.js gauge + stress test table + rebalancing suggestions

**Competitive Edge:**
- **Nitrogen** shows risk numbers but doesn't explain gaps or show rebalancing impact
- **StratiFi** has alignment but weak stress testing
- **Farther:** Real stress tests + tax-aware rebalancing + visual "what-if" scenarios

**Advisor Value:**
- Instantly see misalignments (overconservative retirees, under-allocated accumulators)
- Data-driven rebalancing recommendations (not gut feel)
- Client education tool (show consequences, not just numbers)

**Client Value:**
- Understand *why* they own what they own
- See real downside risk with their actual holdings
- Make informed decisions about risk/reward trade-offs

---

## **Enhancement 3: Adaptive Risk Profiling Engine**
### "AI-Powered Recalibration" — Dynamic risk scoring based on life events + market conditions

**Problem:**
- Risk tolerance isn't static — it changes with life events, market conditions, age
- Most tools require manual re-takes (annual, at best)
- Advisors miss drift until clients panic or complain

**Solution:**
**Continuous risk monitoring** with AI-triggered recalibration prompts

**How It Works:**

**1. Trigger Detection:**
System monitors for risk-shifting events:

**Life Events (from CRM/calendar/transcript data):**
- Job loss, inheritance, windfall, divorce, new child
- Retirement (within 5 years), major purchase (home, business)
- Health crisis, death of spouse

**Market Events (from Backblaze data):**
- VIX spike >30 (high volatility)
- Portfolio drawdown >10% in 30 days
- Sector crash (client's concentrated holdings)

**Behavioral Signals (from account activity):**
- Login frequency spike (3x normal = anxiety)
- Trade frequency increase (panic trading)
- Cash hoarding (selling growth assets)

**2. Adaptive Questionnaire:**
Instead of full 25-question re-take, ask **contextual micro-surveys**:

*Example: VIX spike to 35 (high volatility)*
> "Markets are down 12% this month. Quick check-in:  
> 1. How are you feeling about your portfolio? (calm/concerned/anxious)  
> 2. Are you tempted to make changes? (yes/no)  
> 3. Would you like to talk? (schedule call / send email / I'm fine)"

*Example: Client inherited $500K*
> "Congratulations on your inheritance. This changes your risk capacity:  
> 1. Do you plan to invest this, spend it, or hold cash?  
> 2. Has your timeline for major goals changed?  
> 3. Would you like to revisit your risk profile?"

**3. Risk Score Evolution:**
- Track risk score over time (tolerance, capacity, composure)
- Visualize drift: "Your tolerance has dropped from 75 to 58 over the past year"
- Flag misalignments: "Your capacity increased (windfall), but tolerance stayed flat — opportunity to take more risk"

**4. Advisor Alerts:**
- CRM notification: "John's composure score dropped 18 points after market decline — recommend proactive call"
- Dashboard: Risk score heatmap across all clients (who's drifting?)

**Implementation:**
- Event detection engine (integrates with CRM, portfolio data, market feeds)
- Micro-survey library (contextual questions by event type)
- Score versioning in `risk_profiles` table (`scenario_id` tracks re-assessments)
- AI model: Predict drift risk (logistic regression on historical behavior)
- API: `POST /api/v1/risk/recalibrate` (trigger adaptive survey)

**Competitive Edge:**
- **No one** has continuous adaptive profiling (all tools are static annual re-takes)
- **Dynamic Planner** (UK) just added "AI insights" but not full adaptive scoring
- **Farther:** First platform to auto-detect risk drift and prompt recalibration

**Advisor Value:**
- Catch drift before clients panic or disengage
- Data-driven intervention timing (not guesswork)
- Scalable (AI handles detection, advisor handles high-priority alerts)

**Client Value:**
- Feels like advisor is always watching out for them
- No need to remember to "update risk profile" — system prompts them
- Reduces emotional decision-making (system asks before they act)

---

## Recommendation Matrix

| Enhancement | Impact | Effort | Differentiation | Priority |
|-------------|--------|--------|-----------------|----------|
| **1. Behavioral Composure Score** | 🔥🔥🔥 High | 🛠️ Medium (8-10 questions + scoring logic) | 🏆 Moderate (Orion has it) | **#2** |
| **2. Portfolio-Risk Alignment Dashboard** | 🔥🔥🔥 High | 🛠️🛠️ High (stress engine + UI) | 🏆🏆 High (unique visual storytelling) | **#1** |
| **3. Adaptive Risk Profiling Engine** | 🔥🔥 Medium (long-term value) | 🛠️🛠️🛠️ Very High (AI + event detection) | 🏆🏆🏆 Extreme (no one has this) | **#3 (v2.0)** |

---

## Build Sequence

**Phase 1 (4 weeks): Portfolio-Risk Alignment Dashboard**
- Leverage existing Compass + Focus stack
- High visual impact for demos
- Immediate advisor value

**Phase 2 (3 weeks): Behavioral Composure Score**
- Add questions to existing questionnaire
- Expand `risk_profiles` schema
- Train advisors on composure-based client segmentation

**Phase 3 (8 weeks): Adaptive Risk Profiling Engine**
- Build event detection pipeline
- Create micro-survey library
- Train AI drift prediction model

---

## Next Steps

1. **Pick one:** Which enhancement to spec first?
2. **Validate:** Interview 3-5 advisors at Farther (do they agree these are pain points?)
3. **Prototype:** Build alignment dashboard in 1 week (proof of concept)
4. **Test:** Run with 10 beta clients, gather feedback
5. **Ship:** Full production rollout

---

**My vote:** Start with **Enhancement #2 (Portfolio-Risk Alignment Dashboard)** — highest impact, leverages existing infrastructure, perfect for demo/sales.

Want me to spec it out for build?
