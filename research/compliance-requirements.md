# Regulatory Compliance Requirements: RIA Technology Platform
**Version:** 1.0  
**Date:** February 22, 2026  
**Author:** Ledger (Farther Technology Team)

---

## Executive Summary

Farther's risk assessment and planning platform must comply with multiple regulatory frameworks:
- **SEC Investment Adviser Marketing Rule** (Rule 206(4)-1)
- **Regulation Best Interest (Reg BI)** - broker-dealer standard
- **Fiduciary Duty** - RIA standard (higher than Reg BI)
- **SEC Books and Records** (Rule 204-2)
- **SOC 2 Type II** - data security for service organizations
- **FINRA** (if platform used by hybrid advisors)

**Design Principle:** Compliance is **automatic, not manual**. Audit trails are generated as a byproduct of normal workflows, not separate documentation tasks.

---

## 1. SEC Investment Adviser Marketing Rule

### Overview

**Effective:** May 4, 2021 (replaced Advertising Rule)

**Scope:** Applies to all RIA communications with clients and prospects, including:
- Risk assessments
- Portfolio proposals
- Performance reports
- Client portals

**Source:** https://www.sec.gov/investment/investment-adviser-marketing

### Key Requirements

#### A. Prohibited Statements

**Cannot include:**
- Untrue or misleading statements
- References to specific profitable recommendations without context of all recommendations
- Testimonials or endorsements without disclosures
- Performance results without required disclosures

**Implications for Farther Platform:**

❌ **Bad:** "Our AI-powered risk assessment increases returns by 15%"  
✅ **Good:** "Our risk assessment helps advisors align portfolios with client preferences. Past performance does not guarantee future results."

❌ **Bad:** "Clients following our proposals outperformed the S&P 500 by 8%"  
✅ **Good:** "Historical performance data available upon request. Results vary by client risk tolerance and market conditions."

#### B. Required Disclosures for Performance

**Rule:** Any presentation of portfolio performance must include:

1. **Time period** covered
2. **Whether performance is net or gross of fees**
3. **Material facts** about calculations and assumptions
4. **Benchmark comparison** (if relevant index exists)

**Implementation in Farther Platform:**

```typescript
interface PerformanceDisclosure {
  timePeriod: { start: Date; end: Date };
  netOfFees: boolean;
  assumptions: string[];  // e.g., "Assumes reinvestment of dividends"
  benchmarkUsed?: string; // e.g., "S&P 500 Total Return"
  disclaimers: string[];  // "Past performance does not guarantee future results"
}

// Every performance chart must include this metadata
function generatePerformanceReport(clientId: string): {
  data: number[];
  disclosure: PerformanceDisclosure;
} {
  return {
    data: [...], // actual performance numbers
    disclosure: {
      timePeriod: { start: new Date('2020-01-01'), end: new Date('2025-12-31') },
      netOfFees: true,
      assumptions: [
        "Assumes reinvestment of all dividends and capital gains",
        "Does not include impact of taxes",
        "Results may vary based on market conditions"
      ],
      benchmarkUsed: "S&P 500 Total Return Index",
      disclaimers: [
        "Past performance does not guarantee future results",
        "Individual results may vary based on risk tolerance and investment objectives"
      ]
    }
  };
}
```

**UI Requirement:** Disclosures must be **displayed prominently**, not hidden in footnotes.

---

#### C. Hypothetical Performance (Monte Carlo Projections)

**Rule:** If showing projected future returns (e.g., Monte Carlo retirement simulations), must:

1. **Label clearly as hypothetical**
2. **Disclose material assumptions** (expected returns, volatility, contribution amounts)
3. **State limitations** (model risk, uncertainty)
4. **Provide risk of loss** context (not just upside scenarios)

**Implementation:**

```typescript
interface MonteCarloDisclosure {
  modelType: string; // "Geometric Brownian Motion"
  assumptions: {
    expectedReturn: number;
    volatility: number;
    inflationRate: number;
    annualContributions: number;
  };
  limitations: string[];
  riskWarning: string;
}

const monteCarloReport = {
  successProbability: 78, // % of simulations meeting goal
  medianFinalValue: 2_500_000,
  percentile5: 800_000, // worst-case scenario
  percentile95: 5_000_000, // best-case scenario
  
  disclosure: {
    modelType: "Monte Carlo simulation using Geometric Brownian Motion",
    assumptions: {
      expectedReturn: 0.08,
      volatility: 0.15,
      inflationRate: 0.03,
      annualContributions: 25_000
    },
    limitations: [
      "Model assumes returns follow a log-normal distribution, which may not reflect actual market behavior",
      "Does not account for sequence-of-returns risk or market regime changes",
      "Tax impacts are simplified and may vary based on individual circumstances"
    ],
    riskWarning: "Simulations are hypothetical and do not guarantee future results. Actual outcomes may be significantly different. There is a risk of loss."
  }
};
```

**Compliance Checkpoint:** All Monte Carlo outputs must include 5th percentile (bad outcome) scenario, not just median/optimistic cases.

---

### Enforcement & Penalties

**Recent SEC Actions:**

- **2023:** SEC fined multiple RIAs for "cherry-picking" performance (showing only profitable recommendations)
- **2024:** SEC warned against AI-generated marketing materials without human review and disclaimers

**Penalty Range:** $50K-$500K per violation + cease-and-desist orders

**Mitigation Strategy:**
- All client-facing content reviewed by compliance officer before publication
- Automated disclaimers injected into every performance report, proposal, and projection

---

## 2. Regulation Best Interest (Reg BI)

### Overview

**Effective:** June 30, 2020

**Scope:** Applies to broker-dealers making recommendations to retail clients

**Note:** Farther is an RIA (held to **fiduciary standard**, which is higher than Reg BI). However, if platform is used by hybrid advisors (RIA + broker-dealer), Reg BI applies.

**Source:** https://www.sec.gov/regulation-best-interest

### Key Requirements

#### A. Disclosure Obligation

**Must disclose:**
- Material facts about the recommendation
- Conflicts of interest
- Fees and costs

**Implementation:**

```typescript
interface RegBIDisclosure {
  recommendation: string;
  conflicts: string[];
  fees: {
    advisoryFee: number;      // % of AUM
    productFees: number;       // expense ratios, commissions
    totalEstimatedCost: number;
  };
  alternatives: string[]; // alternative products considered
}

// Example: Recommending a 60/40 stock/bond portfolio
const disclosure: RegBIDisclosure = {
  recommendation: "60% equity / 40% fixed income allocation using low-cost index funds",
  conflicts: [
    "Advisor receives a fee based on assets under management (1% annually)",
    "No additional commissions or product-based compensation"
  ],
  fees: {
    advisoryFee: 0.01,       // 1%
    productFees: 0.0015,     // 0.15% weighted avg expense ratio
    totalEstimatedCost: 0.0115 // 1.15% total
  },
  alternatives: [
    "Self-directed brokerage account (lower fees, no advice)",
    "Robo-advisor (0.25% fee, automated rebalancing)",
    "Actively managed funds (higher fees, potential for outperformance)"
  ]
};
```

---

#### B. Care Obligation

**Must:**
- Understand the client's investment profile (risk tolerance, time horizon, liquidity needs)
- Conduct reasonable diligence on recommended products
- Have a reasonable basis to believe the recommendation is in the client's best interest

**Implementation:**

**Risk Assessment Requirement:**
Before making any recommendation, platform must:
1. Complete risk tolerance questionnaire (behavioral + capacity)
2. Document client's investment objectives
3. Match portfolio to risk profile

**Audit Trail:**

```typescript
interface SuitabilityAudit {
  clientId: string;
  assessmentDate: Date;
  riskProfile: RiskProfile;
  recommendedAllocation: Allocation;
  reasonableBasisDocumentation: string; // why this recommendation fits the client
  diligenceDocumentation: string; // research on recommended funds/strategies
}

// Example audit record
const audit: SuitabilityAudit = {
  clientId: "abc-123",
  assessmentDate: new Date('2026-02-15'),
  riskProfile: {
    riskWillingness: 65,
    riskCapacity: 70,
    recommendedRiskLevel: 65
  },
  recommendedAllocation: {
    stocks: 60,
    bonds: 35,
    alternatives: 5
  },
  reasonableBasisDocumentation: "Client has 15-year time horizon, moderate risk tolerance (score 65/100), and capacity to withstand 30% drawdown. 60/40 allocation historically delivers 7-9% returns with 12-15% volatility, aligning with client profile.",
  diligenceDocumentation: "Recommended funds: VTI (expense ratio 0.03%), BND (0.03%). Funds chosen for low cost, broad diversification, tax efficiency. Alternative considered: active management (higher fees, no evidence of consistent outperformance)."
};
```

**Storage:** All suitability audits stored in Aurora PostgreSQL `compliance_audit_log` table (immutable, 7-year retention).

---

#### C. Conflict of Interest Mitigation

**Must:**
- Establish, maintain, and enforce policies to identify and mitigate conflicts
- Disclose material conflicts that cannot be eliminated

**Farther-Specific Conflicts:**

| Conflict | Mitigation |
|----------|-----------|
| **AUM-based fee** (advisor has incentive to recommend higher allocation to managed accounts vs. cash) | Disclose fee structure; document why allocation is in client's best interest |
| **Proprietary products** (if Farther offers own funds/strategies) | Must disclose; demonstrate cost/performance vs. third-party alternatives |
| **Referral fees** (if Farther pays advisors to refer clients) | Disclose amount and impact on recommendation |

**Platform Enforcement:**

```typescript
// Before finalizing any recommendation, platform checks for conflicts
async function checkConflictsOfInterest(
  recommendation: Recommendation,
  advisor: Advisor
): Promise<{ hasConflict: boolean; disclosures: string[] }> {
  const disclosures: string[] = [];
  let hasConflict = false;
  
  // Check for proprietary products
  if (recommendation.funds.some(f => f.issuer === 'Farther Asset Management')) {
    hasConflict = true;
    disclosures.push("This recommendation includes proprietary Farther funds. Advisor receives no additional compensation for recommending these funds.");
  }
  
  // Check for high-fee products
  const avgExpenseRatio = recommendation.funds.reduce((sum, f) => sum + f.expenseRatio, 0) / recommendation.funds.length;
  if (avgExpenseRatio > 0.50) { // threshold for "high fee"
    disclosures.push(`Average expense ratio: ${(avgExpenseRatio * 100).toFixed(2)}%. Lower-cost alternatives available but may not meet all investment objectives.`);
  }
  
  return { hasConflict, disclosures };
}
```

---

## 3. Fiduciary Duty (RIA Standard)

### Overview

**Applies to:** All Registered Investment Advisers (Farther is an RIA)

**Standard:** **Act in the client's best interest at all times** (higher bar than Reg BI's "reasonable basis")

**Key Difference from Reg BI:**
- Reg BI: "Recommendation must be in client's best interest **at the time it's made**"
- Fiduciary: "Ongoing duty to monitor and update recommendations as circumstances change"

### Ongoing Monitoring Requirement

**Platform Implementation:**

```typescript
// Quarterly review workflow
async function quarterlyClientReview(clientId: string): Promise<ReviewReport> {
  const client = await getClient(clientId);
  const currentPortfolio = await getPortfolio(clientId);
  const currentRiskProfile = await getRiskProfile(clientId);
  
  // Check for drift
  const driftAnalysis = analyzePortfolioDrift(currentPortfolio, client.targetAllocation);
  
  // Check if risk profile has changed (life events, market changes)
  const riskProfileChanged = await detectRiskProfileChange(client);
  
  // Generate action items
  const actionItems: string[] = [];
  
  if (driftAnalysis.exceedsThreshold) {
    actionItems.push(`Portfolio has drifted ${driftAnalysis.percentDrift}% from target. Recommend rebalancing.`);
  }
  
  if (riskProfileChanged) {
    actionItems.push("Client's risk profile may have changed. Schedule risk reassessment meeting.");
  }
  
  // Log review for compliance
  await db.insert('compliance_audit_log', {
    client_id: clientId,
    action_type: 'quarterly_review',
    action_details: { driftAnalysis, riskProfileChanged, actionItems },
    performed_by: 'system_automated',
    performed_at: new Date()
  });
  
  return {
    client,
    driftAnalysis,
    riskProfileChanged,
    actionItems
  };
}
```

**Advisor Notification:**
If automated review detects issues, system sends alert to advisor:

```
Subject: Client Review Required: John Smith

Quarterly review for John Smith flagged the following:
- Portfolio drift: 8.2% (threshold: 5%)
- Risk profile may have changed (client turned 65, nearing retirement)

Action required:
1. Schedule meeting to discuss rebalancing
2. Re-assess risk tolerance and time horizon
3. Update IPS if objectives have changed

Compliance deadline: 30 days from this notice
```

---

## 4. SEC Books and Records (Rule 204-2)

### Overview

**Requirement:** RIAs must maintain records of all client communications, recommendations, and transactions for **7 years** (5 years easily accessible, 2 years archived).

**Source:** https://www.sec.gov/divisions/investment/imsecrecordkeeping.htm

### Records That Must Be Kept

| Record Type | Retention | Storage in Farther Platform |
|-------------|-----------|----------------------------|
| **Client agreements** (IPS, advisory contracts) | 7 years | Aurora `document_versions` table + S3 |
| **Risk assessments** | 7 years | CockroachDB `risk_profiles` + compliance log |
| **Portfolio proposals** | 7 years | Aurora `document_versions` + S3 |
| **Trade confirmations** | 7 years | Aurora `trade_orders` |
| **Client communications** (emails, meeting notes) | 7 years | HubSpot CRM + compliance log |
| **Performance reports** | 7 years | Aurora `document_versions` + S3 |
| **Fee disclosures** | 7 years | Aurora `document_versions` |

### Implementation: Immutable Audit Log

**Design:**
- All compliance-relevant actions write to `compliance_audit_log` (Aurora PostgreSQL)
- Table is **append-only** (no updates or deletes allowed)
- Triggers prevent modification

```sql
CREATE TABLE compliance_audit_log (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL,
    action_type TEXT NOT NULL,
    action_details JSONB NOT NULL, -- full context of action
    performed_by UUID NOT NULL REFERENCES users(user_id),
    performed_at TIMESTAMPTZ DEFAULT NOW(),
    regulatory_basis TEXT, -- e.g., "SEC_Marketing_Rule"
    related_document_id UUID,
    
    -- Prevent updates/deletes
    CONSTRAINT no_updates CHECK (performed_at IS NOT NULL)
);

-- Trigger to prevent updates
CREATE OR REPLACE FUNCTION prevent_audit_log_updates()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit log is immutable. Updates and deletes are not allowed.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_immutable
BEFORE UPDATE OR DELETE ON compliance_audit_log
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_updates();
```

### Backup & Archival Strategy

**Active Storage (Years 1-5):**
- Aurora PostgreSQL primary region (US-West)
- Cross-region replica (US-East) for disaster recovery

**Archive Storage (Years 6-7):**
- S3 Glacier Deep Archive (99.999999999% durability, $1/TB/month)
- Write-once-read-many (WORM) configuration to prevent tampering

**Retrieval SLA:**
- Years 1-5: <1 second (hot storage)
- Years 6-7: <12 hours (glacier retrieval)

---

## 5. SOC 2 Type II Compliance

### Overview

**Purpose:** Third-party attestation that Farther's platform has adequate security controls for handling sensitive financial data.

**Audience:** Enterprise RIA clients (they require SOC 2 reports from all vendors handling client data)

**Source:** https://www.aicpa.org/soc4so

### Trust Service Criteria

SOC 2 evaluates 5 criteria:

#### A. Security

**Requirement:** System is protected against unauthorized access (physical and logical).

**Implementation:**

| Control | Technology |
|---------|-----------|
| **Data encryption at rest** | Aurora: AWS KMS encryption; CockroachDB: TDE (Transparent Data Encryption) |
| **Data encryption in transit** | TLS 1.3 for all API calls |
| **Access control** | Role-based access (RBAC) via JWT tokens; row-level security in database |
| **Network isolation** | VPC with private subnets; no public internet access to databases |
| **Secrets management** | AWS Secrets Manager for API keys, database credentials |
| **Penetration testing** | Annual third-party pen test; quarterly vulnerability scans |

**Audit Evidence:**
- Screenshots of AWS KMS encryption settings
- TLS certificate chain
- RBAC policy documentation
- Pen test reports

---

#### B. Availability

**Requirement:** System is available for operation and use as committed (uptime SLA).

**Farther SLA:** 99.9% uptime (allows ~8.7 hours downtime/year)

**Implementation:**

| Control | Technology |
|---------|-----------|
| **Multi-region deployment** | CockroachDB replicas in US-West, US-East, US-Central |
| **Auto-scaling** | ECS Fargate auto-scales based on CPU/memory |
| **Health checks** | CloudWatch monitors API latency, error rates |
| **Incident response** | PagerDuty alerts on-call engineer within 5 minutes |
| **Disaster recovery** | Automated failover to backup region (RTO: 4 hours, RPO: 15 minutes) |

**Audit Evidence:**
- Uptime metrics from last 12 months
- Incident response runbooks
- DR test results (quarterly)

---

#### C. Processing Integrity

**Requirement:** System processing is complete, valid, accurate, timely, and authorized.

**Implementation:**

| Control | Technology |
|---------|-----------|
| **Data validation** | Input validation on all API endpoints (TypeScript types + Zod schemas) |
| **Reconciliation** | Daily reconciliation of portfolio values vs. custodian feeds |
| **Version control** | All code changes tracked in Git; peer review required |
| **Testing** | 80%+ code coverage (unit tests, integration tests) |
| **Change management** | Staging environment for testing before production deploy |

**Audit Evidence:**
- Test coverage reports
- Reconciliation logs
- Git commit history
- Deployment logs

---

#### D. Confidentiality

**Requirement:** Confidential information is protected as committed.

**Implementation:**

| Control | Technology |
|---------|-----------|
| **Data classification** | All client data marked as "confidential" |
| **Access logging** | Every database query logged with user ID and timestamp |
| **Employee background checks** | All engineers undergo background checks before accessing production |
| **NDA enforcement** | All employees and contractors sign NDAs |
| **Data retention policies** | Automated deletion of client data after 7 years (unless legally required to keep longer) |

**Audit Evidence:**
- Data classification policy
- Access logs
- NDA templates
- Background check records (anonymized)

---

#### E. Privacy

**Requirement:** Personal information is collected, used, retained, disclosed, and disposed of in accordance with privacy notice and applicable laws (GDPR, CCPA).

**Implementation:**

| Control | Technology |
|---------|-----------|
| **Privacy notice** | Clear disclosure of what data is collected and how it's used |
| **Consent management** | Clients must opt-in to data sharing |
| **Data minimization** | Collect only data necessary for service delivery |
| **Right to deletion** | Clients can request data deletion (subject to legal retention requirements) |
| **Third-party data sharing** | Only share with vendors who sign DPAs (Data Processing Agreements) |

**Audit Evidence:**
- Privacy policy published on website
- Consent records
- DPAs with vendors (HubSpot, custodians, etc.)

---

### SOC 2 Audit Process

**Timeline:**
- **Readiness assessment:** 2-3 months (gap analysis, implement missing controls)
- **Type I audit:** 1 month (auditor reviews control design)
- **Type II audit:** 6-12 months (auditor tests control effectiveness over time)

**Cost:**
- **Readiness consultant:** $20K-$50K
- **SOC 2 audit:** $30K-$80K annually

**Deliverable:**
- SOC 2 Type II report (provided to enterprise clients upon request)

---

## 6. Data Privacy Regulations

### CCPA (California Consumer Privacy Act)

**Applies to:** Any business serving California residents with $25M+ annual revenue OR 50K+ consumers

**Farther Status:** Likely applies (financial services, growing client base)

**Requirements:**

1. **Disclosure:** Privacy policy must disclose:
   - Categories of personal information collected
   - Purposes for collection
   - Third parties with whom data is shared

2. **Right to Know:** Clients can request:
   - What personal information is collected
   - Sources of that information
   - Why it was collected

3. **Right to Delete:** Clients can request deletion of their data (with exceptions for legal/contractual obligations)

4. **Opt-Out of Sale:** Clients can opt out of data being sold (Farther does not sell data, but must still provide opt-out mechanism)

**Implementation:**

```typescript
// Privacy Request Handler
async function handlePrivacyRequest(
  clientId: string,
  requestType: 'know' | 'delete' | 'opt-out'
): Promise<PrivacyResponse> {
  
  if (requestType === 'know') {
    // Gather all data about client
    const data = {
      personalInfo: await getClientProfile(clientId),
      financialData: await getPortfolioHistory(clientId),
      interactions: await getClientInteractions(clientId),
      thirdParties: ['HubSpot', 'Schwab', 'Bloomberg'] // who we share with
    };
    
    return { status: 'fulfilled', data };
  }
  
  if (requestType === 'delete') {
    // Check if data can be deleted (SEC requires 7-year retention)
    const accountAge = await getAccountAge(clientId);
    
    if (accountAge < 7 * 365) {
      return {
        status: 'denied',
        reason: 'SEC regulations require retention of financial records for 7 years.'
      };
    }
    
    // If past retention period, schedule deletion
    await scheduleDataDeletion(clientId);
    return { status: 'scheduled', deletionDate: '30 days from now' };
  }
  
  if (requestType === 'opt-out') {
    await updatePrivacySettings(clientId, { optOutOfDataSharing: true });
    return { status: 'fulfilled' };
  }
}
```

---

## 7. FINRA (if applicable)

**Applies to:** Broker-dealers (not pure RIAs)

**Farther Status:** Only applies if Farther offers brokerage services OR platform is used by hybrid RIA/BD advisors

**Key Rules:**

### FINRA Rule 2090 (Know Your Customer)

**Requirement:** Use reasonable diligence to know and retain essential facts about each customer.

**Overlap with Reg BI:** Similar to Reg BI's Care Obligation

**Implementation:** Risk assessment questionnaire + KYC data collection (same as Reg BI compliance)

---

### FINRA Rule 2111 (Suitability)

**Requirement:** Have a reasonable basis to believe a recommendation is suitable based on customer's investment profile.

**Implementation:** Same as Reg BI suitability audit (see section 2B above)

---

## Compliance Workflow Summary

### New Client Onboarding

```
1. Client creates account → Privacy notice displayed → Client consents
2. KYC data collected (name, SSN, address, employment)
3. Risk assessment questionnaire → Behavioral + capacity scores calculated
4. Proposal generated → Fee disclosure included → Conflicts disclosed
5. IPS presented → Client e-signs → Document stored in S3 + audit log entry
6. First portfolio review scheduled (quarterly)

Compliance checkpoints:
✓ Privacy consent logged
✓ Risk profile documented
✓ Suitability basis recorded
✓ IPS signed and stored
✓ All actions logged in immutable audit trail
```

### Ongoing Compliance

```
Quarterly:
- Automated portfolio drift detection → Advisor alert if > 5% drift
- Risk profile re-assessment prompt (if client approaching life milestone)

Annually:
- Performance report generated → Disclosures included → Client review
- IPS review → Client re-signs if changes

Continuous:
- All advisor-client interactions logged (HubSpot → compliance log)
- Trade orders logged with suitability basis
- Conflict disclosures updated when fees or products change
```

---

## Audit Preparedness

### SEC Examination Process

**Frequency:** RIAs are examined every 3-5 years on average

**What SEC Looks For:**

1. **Are client communications compliant with Marketing Rule?**
   - SEC requests sample proposals, performance reports, client emails
   - Platform must produce these instantly from S3 + Aurora

2. **Are suitability determinations documented?**
   - SEC reviews random sample of client accounts
   - Platform must show: risk profile → recommendation → reasonable basis documentation

3. **Are records retained for 7 years?**
   - SEC tests by requesting old records (e.g., 2019 IPS for Client X)
   - Platform must retrieve from archive within 24 hours

4. **Are conflicts of interest disclosed?**
   - SEC checks fee disclosures, proprietary product usage
   - Platform must produce conflict disclosure logs

### Mock Audit Checklist

**Annually, Farther should run internal mock SEC audit:**

- [ ] Select 10 random clients
- [ ] Retrieve all documents (IPS, proposals, risk assessments) from last 7 years
- [ ] Verify all required disclosures present
- [ ] Check suitability documentation (reasonable basis)
- [ ] Confirm immutable audit log has no gaps
- [ ] Test disaster recovery (restore from backup)

**Goal:** Any document producible within 1 hour, any backup restorable within 4 hours.

---

## Next Steps: Compliance Implementation Roadmap

**Month 1:**
- Implement immutable audit log (Aurora PostgreSQL)
- Build automated disclosure injection (Marketing Rule compliance)

**Month 2:**
- Suitability audit workflow (Reg BI / Fiduciary)
- Document storage with 7-year retention (S3 + versioning)

**Month 3:**
- SOC 2 readiness assessment
- Privacy request handler (CCPA compliance)

**Month 4:**
- SOC 2 Type I audit
- Internal mock SEC audit

**Month 10:**
- SOC 2 Type II audit completion (6-month observation period)

**Ongoing:**
- Quarterly compliance reviews
- Annual pen tests
- Continuous monitoring of regulatory changes
