# Proposify - Client Proposal Tool

**Module:** #4 in Farther Intelligence Suite  
**Tagline:** "Craft compelling proposals. Go Farther."  
**Icon:** 📄  
**Status:** Phase 5 - Building Now  
**Priority:** High (per Tim's direction)

---

## Overview

Proposify is Farther's proposal generation and presentation tool that helps advisors create compelling, branded proposals for prospects. It combines fee calculations, value propositions, and competitive positioning into professional proposals that convert prospects into clients.

---

## Core Features

### 1. **Fee Calculator**
Calculate and compare advisor fees vs. competitors.

**Inputs:**
- Portfolio size
- Fee structure (AUM %, flat fee, hybrid)
- Service tiers (basic, pro, enterprise)

**Outputs:**
- Annual fee breakdown
- Comparison with industry averages
- Fee justification (value delivered)
- Tax alpha offset (Farther's 1-3% advantage can offset fees)

**Example:**
```
Portfolio: $2M
Farther Fee: 1.0% = $20,000/year
Tax Alpha: 2.0% = $40,000/year
Net Value: $20,000 positive (fees more than paid for)
```

---

### 2. **Value Proposition Builder**
Highlight Farther's unique advantages.

**Key Messages:**
- Preservation-first approach
- 1-3% tax alpha (measurable)
- Human-led, tech-amplified
- Access to private markets
- Institutional-quality diversification

**vs. Competitors:**
- Robo-advisors: No human advisor, no alternatives, no tax optimization
- Traditional RIAs: Manual processes, slow, limited tech
- Private banks: High minimums, rigid, outdated

---

### 3. **Service Comparison Matrix**
Side-by-side comparison of what's included.

| Service | Farther | Robo | Traditional RIA |
|---------|---------|------|-----------------|
| Dedicated Advisor | ✅ | ❌ | ✅ |
| Financial Planning | ✅ | Limited | ✅ |
| Tax Optimization | ✅ (1-3% alpha) | ❌ | Limited |
| Private Markets Access | ✅ | ❌ | Limited |
| Modern Technology | ✅ | ✅ | ❌ |
| Real-Time Monitoring | ✅ | Limited | ❌ |
| Annual Fee | 1.0% | 0.25% | 1.0-1.5% |

---

### 4. **Proposal Templates**
Pre-designed templates for different scenarios.

**Templates:**
- New client onboarding
- 401(k) rollover
- Estate planning
- Tax optimization
- Retirement planning
- Alternative investments

**Customization:**
- Firm logo and branding
- Advisor photo and bio
- Custom messaging
- Personalized recommendations

---

### 5. **ROI Calculator**
Show measurable value of Farther's services.

**Value Drivers:**
- Tax alpha (1-3% annually)
- Fee savings vs. competitors
- Better risk-adjusted returns
- Time saved (tech automation)
- Access to alternatives

**Example:**
```
Annual Benefit Calculation:
- Tax Alpha:              +$40,000 (2% on $2M)
- Time Saved (150 hrs):   +$15,000 (opportunity cost)
- Better Execution:       +$10,000 (reduced slippage)
Total Value:               $65,000/year

Farther Fee:               $20,000/year
Net Benefit:               $45,000/year
ROI:                       225%
```

---

### 6. **E-Signature Integration**
Send proposals with embedded signature requests.

**Flow:**
1. Generate proposal PDF
2. Add signature fields
3. Send via email
4. Track opens and signatures
5. Store signed copy

**Integrations:**
- DocuSign
- HelloSign
- Adobe Sign
- Native signing (simple cases)

---

## User Experience

### Advisor Workflow:

**Step 1: Create Proposal**
- Select template
- Enter client info
- Configure services
- Set fee structure

**Step 2: Customize**
- Add/remove sections
- Edit value propositions
- Upload custom images
- Adjust branding

**Step 3: Calculate Value**
- Input portfolio size
- Calculate fees
- Show ROI
- Compare competitors

**Step 4: Review**
- Preview PDF
- Check all sections
- Verify calculations
- Test links

**Step 5: Send**
- Add client email
- Include message
- Request signature
- Set reminders

**Step 6: Track**
- Monitor opens
- See time spent
- Get signature notification
- Store completed proposal

---

## Technical Architecture

### Database Schema:

```sql
-- Proposals table
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id),
  advisor_id UUID, -- Future: user management
  template_id UUID,
  status VARCHAR(50), -- draft, sent, viewed, signed, declined
  
  -- Client info
  client_name VARCHAR(255),
  client_email VARCHAR(255),
  portfolio_size NUMERIC(15,2),
  
  -- Fee structure
  fee_type VARCHAR(50), -- aum, flat, hybrid
  fee_percentage NUMERIC(5,4), -- e.g., 0.0100 for 1.0%
  fee_annual NUMERIC(15,2),
  
  -- Customization
  custom_sections JSONB,
  branding JSONB,
  
  -- Tracking
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  
  -- Document
  pdf_url TEXT,
  signature_request_id VARCHAR(255), -- DocuSign ID
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proposal templates
CREATE TABLE proposal_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255),
  description TEXT,
  category VARCHAR(50), -- onboarding, rollover, estate, tax, retirement
  template_data JSONB, -- Sections, layout, defaults
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proposal tracking events
CREATE TABLE proposal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES proposals(id),
  event_type VARCHAR(50), -- sent, opened, viewed_section, signed, declined
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### API Endpoints:

```
POST   /api/v1/proposals              - Create new proposal
GET    /api/v1/proposals/:id          - Get proposal
PUT    /api/v1/proposals/:id          - Update proposal
DELETE /api/v1/proposals/:id          - Delete proposal
POST   /api/v1/proposals/:id/send     - Send to client
POST   /api/v1/proposals/:id/sign     - Record signature
GET    /api/v1/proposals/:id/pdf      - Generate/download PDF
GET    /api/v1/proposals/:id/tracking - Get tracking events

GET    /api/v1/proposal-templates     - List templates
POST   /api/v1/proposal-templates     - Create template
```

---

### PDF Generation:

**Library:** Puppeteer (headless Chrome)

**Process:**
1. Render proposal as HTML (React component)
2. Apply Farther branding (CSS)
3. Generate PDF via Puppeteer
4. Upload to storage (Backblaze)
5. Return signed URL

**Sections:**
- Cover page (logo, client name)
- Introduction (advisor bio)
- Value proposition (Farther advantages)
- Fee breakdown (calculator results)
- Service comparison (vs. competitors)
- Investment approach (preservation-first)
- Tax alpha explanation (with examples)
- Next steps (signature, onboarding)
- Disclosures (compliance)

---

## Farther Positioning

### Core Messages:

**Preservation First:**
> "At Farther, we prioritize protecting your wealth before seeking growth. Our institutional-quality portfolios are designed to preserve capital across full market cycles."

**Tax Intelligence:**
> "Our proprietary technology continuously optimizes for taxes, delivering 1-3% in annual tax alpha—often more than covering our advisory fee."

**Human + Tech:**
> "You get a dedicated advisor who leads your strategy, amplified by technology that handles execution, monitoring, and tax optimization faster than any traditional RIA."

**Access to Alternatives:**
> "Through our curated partner network and Farther Asset Management, you gain access to private equity, hedge funds, and other alternatives typically reserved for institutional investors."

---

## MVP Scope (Phase 5)

### Must-Have (Week 1):
- [ ] Database schema (proposals, templates, events)
- [ ] Basic proposal creation (form)
- [ ] Fee calculator (AUM %, flat, hybrid)
- [ ] Value proposition section
- [ ] PDF generation (Puppeteer)
- [ ] Simple HTML template

### Should-Have (Week 2):
- [ ] Multiple templates (3-5 scenarios)
- [ ] Service comparison matrix
- [ ] ROI calculator (tax alpha, value)
- [ ] Branding customization
- [ ] Email sending
- [ ] Tracking (opens, views)

### Nice-to-Have (Future):
- [ ] E-signature integration (DocuSign)
- [ ] Interactive proposals (web view)
- [ ] A/B testing (which proposals convert)
- [ ] Analytics dashboard (conversion rates)
- [ ] Custom section builder
- [ ] Video embeds (advisor intro)

---

## Success Metrics

**Adoption:**
- Proposals created per advisor/month
- Templates used (which are popular)
- Time to create proposal (should be <15 min)

**Conversion:**
- Proposals sent
- Open rate
- Time spent viewing
- Signature rate
- Conversion to client

**Value Demonstration:**
- Average portfolio size in proposals
- Average fee calculated
- Tax alpha shown
- ROI presented

**Target:**
- 50%+ of advisors use Proposify monthly
- 30%+ conversion rate (proposal → client)
- <15 minutes to create proposal
- >80% open rate (email sent)

---

## Build Priority

Tim's direction: **"Build Proposify next - highest priority"**

**Reason:** Proposal tool directly impacts revenue (converts prospects → clients faster).

**Timeline:** 1-2 weeks for MVP

**Resources Needed:**
- Puppeteer (PDF generation) - easy to add
- Email service (SendGrid/AWS SES) - simple integration
- DocuSign API (later) - optional for MVP

---

**Status:** Specification complete, ready to build

*Next: Database schema → API → PDF generator → UI*
