---
name: hubspot-enterprise
description: HubSpot Enterprise administration, configuration, and troubleshooting. Activate when any HubSpot question arises. CRITICAL RULE — never guess about features, limits, or pricing. Verify against official docs or state uncertainty.
---

# HubSpot Enterprise Expert

## Before Answering ANY HubSpot Question
1. Identify which Hub is relevant (Marketing, Sales, Service, Content, Operations/Data Hub)
2. Identify the tier (Starter, Professional, Enterprise) — features differ dramatically
3. If unsure about a feature or limit, say "I'd need to verify this" rather than guessing
4. Reference: Full docs at ~/.openclaw/workspace/memory/hubspot-enterprise-reference.md

## Quick Reference: Enterprise-Only Features

| Feature | Required Hub |
|---|---|
| Custom Objects (10), Calculated Props (200), Hierarchical Teams (300) | Any Enterprise |
| Partitioning, Sandboxes, SSO (SAML 2.0), Permission Sets | Any Enterprise |
| Field-Level Permissions | Any Enterprise |
| Multi-Touch Attribution, Custom Behavioral Events | Marketing Enterprise |
| Adaptive Testing (5 variants) | Marketing/Content Enterprise |
| Predictive Lead Scoring (25 props) | Marketing/Sales Enterprise |
| Business Units/Brands | Marketing Enterprise add-on |
| Conversation Intelligence | Sales/Service Enterprise |
| Recurring Revenue Tracking | Sales Enterprise |
| Conditional SLAs, Breeze AI Agents | Service Enterprise |
| Datasets (50), Snowflake Data Share | Ops Hub Enterprise |
| Memberships (gated content) | Content Hub Enterprise |

## Workflow Troubleshooting Checklist
- Is the record enrolled? Check enrollment history on the record.
- Is the workflow turned on? (Sounds obvious but check)
- Are enrollment triggers correct? (Event vs filter vs schedule)
- Is re-enrollment enabled if needed?
- Check the action log (retained 90 days)
- For custom code: 20-sec timeout, 128MB memory limit
- Webhook failures retry for 3 days with exponential backoff

## API Quick Reference
- Auth: Private App tokens or OAuth 2.0 (API keys DEPRECATED)
- Enterprise rate: 1M requests/day, 190 req/10sec burst
- Professional rate: 650K requests/day
- Snowflake Data Share: bypasses API limits entirely
- Custom Events API: 1,250 req/sec, 500 per batch
- Import API: 80M rows/day

## Common Configuration Tasks
- **Add custom object:** Settings > Objects > Custom Objects > Create (Enterprise only)
- **Set up partitioning:** Settings > Users & Teams > Teams, then assign assets
- **Create permission set:** Settings > Users & Teams > Permission Sets
- **Configure SSO:** Settings > Account > Security > SSO
- **Enable data privacy:** Settings > Privacy & Consent > Data Privacy
- **Set up sandbox:** Settings > Account > Sandbox
- **Create calculated property:** Settings > Properties > Create > Calculation type

## Data Model Best Practices
- Standard objects first, custom objects only when standard won't work
- Association labels add context (e.g., "Decision Maker" on Contact-Deal)
- 1,000 custom properties per object limit — plan property architecture early
- Use property groups to organize related fields
- Active lists auto-update; static lists don't — choose wisely

## Financial Services Patterns
- Deal stages: Prospect > Discovery > Proposal > AUM Onboarding > Active Client
- Custom objects: Portfolios, Custodian relationships, Households
- Workflows: Onboarding, review scheduling, AUM milestones, birthday outreach
- HubSpot is NOT purpose-built for SEC/FINRA compliance — supplement with specialized tools
- Redtail > HubSpot migration: CSV export/import, email as matching key, Companies > Contacts > Deals > Activities order
