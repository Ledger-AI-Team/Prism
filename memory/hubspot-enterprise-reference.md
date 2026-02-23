# HubSpot Enterprise Reference Guide

*Compiled from official HubSpot documentation (knowledge.hubspot.com, developers.hubspot.com). Last updated: February 2026.*
*IMPORTANT: HubSpot updates features regularly. Always verify current limits at legal.hubspot.com/hubspot-product-and-services-catalog*

---

## 1. Marketing Hub Enterprise

**Pricing:** $3,600/mo base, includes 5 core seats. Additional seats $75/mo each. Onboarding: $7,000 (required).

### Enterprise-Only Features

| Feature | Available in Pro? | Enterprise Detail |
|---|---|---|
| Multi-touch attribution | No | 6 built-in models + Custom |
| Adaptive testing | No | Up to 5 page variations, ML auto-optimizes traffic allocation |
| Predictive lead scoring | No | AI-driven, up to 25 scoring properties |
| Custom behavioral events | No | 30M occurrences/mo, event visualizer, JS, API, spreadsheet, webhooks |
| Journey Automation | No | Multi-stage automated customer journeys (Spring 2025) |
| Lookalike Lists | No | Breeze AI finds contacts similar to existing lists (Spring 2025) |
| Hierarchical teams | No | Nested parent/child team structures |
| Field-level permissions | No | View and edit / View only / No access per property |
| Partitioning | No | Segment assets by team |
| Single sign-on (SSO) | No | SAML 2.0 |
| Sandboxes | No | 1 included, $750/mo additional |
| Custom objects | No | Up to 10 definitions |

### Key Limits

| Resource | Enterprise Limit |
|---|---|
| Email sends | 20x marketing contact tier per calendar month |
| Workflows | 1,000 |
| Custom reports | 500 |
| Dashboards | 50 |
| Social accounts | 300 |
| Lead scoring properties | 25 |
| Calculated properties | 200 |
| Active lists | 1,500 |
| Static lists | 1,500 |
| Custom behavioral events | 30M occurrences/mo |

### Multi-Touch Attribution

Six built-in models plus Custom:
- **First Touch:** 100% credit to first interaction
- **Last Touch:** 100% credit to last interaction before conversion
- **Linear:** Equal credit across all touchpoints
- **U-Shaped:** 40% first touch, 40% lead creation, 20% split across middle
- **W-Shaped:** 30% first touch, 30% lead creation, 30% deal creation, 10% split across rest
- **Full-Path:** 22.5% each to first touch, lead creation, deal creation, closed-won; 10% split across rest
- **Custom:** Define your own weighting

### Adaptive Testing

- Up to 5 page variations per test
- Machine learning automatically shifts traffic to winning variations
- Replaces traditional A/B with continuous optimization
- Requires Content Hub Enterprise or Marketing Hub Enterprise

### Predictive Lead Scoring

- AI-driven, requires no manual configuration
- Up to 25 scoring properties
- Combines engagement signals + demographic/firmographic fit
- Maximum score: 500
- Updates daily based on new data
- Available for contacts and companies

### Custom Behavioral Events

- **Creation methods:** Event visualizer (codeless), JavaScript API, HTTP API, spreadsheet upload, webhooks
- **Limit:** 30M occurrences per month
- **Properties:** Up to 50 custom properties per event definition
- **Use in:** Workflows, lists, reports, attribution, lead scoring
- **Retention:** 90 days for event completions in reporting

### Journey Automation (Spring 2025)

- Multi-stage automated customer journeys
- Visual canvas for mapping lifecycle stages
- Branching logic based on behavior, properties, and events
- Cross-channel orchestration (email, ads, internal notifications)

### Lookalike Lists (Spring 2025)

- Breeze AI analyzes existing high-value contact lists
- Identifies similar contacts in your database
- Based on behavioral and demographic patterns
- Outputs a new list for targeting

---

## 2. Sales Hub Enterprise

**Pricing:** $150/seat/mo (per user). Onboarding: $3,500 (required).

### Enterprise-Only Features

| Feature | Available in Pro? | Enterprise Detail |
|---|---|---|
| Predictive lead scoring | No | AI-driven automatic scoring |
| Conversation intelligence | No | Call recording, transcription, AI coaching |
| Recurring revenue tracking | No | MRR/ARR, renewals, upgrades, downgrades, churn |
| Deal journey analytics | No | Content impact on deal progression |
| Advanced forecasting | No | Breeze AI predictions, at-risk flagging |
| Deal approval process | No | Required approvals before deal stage changes |
| Hierarchical teams | No | Nested parent/child |
| Custom objects | No | Up to 10 definitions |
| Sandboxes | No | 1 included |
| SSO | No | SAML 2.0 |

### Key Limits

| Resource | Enterprise Limit |
|---|---|
| Deal pipelines | 50 |
| Playbooks | 5,000 |
| Sequences (emails/day/user) | 1,000 |
| Phone numbers | 5 |
| Calling minutes | 12,000/mo per user |
| Custom reports | 500 |
| Forecasting categories | Custom |

### Conversation Intelligence

- Automatic call recording and transcription
- AI-powered coaching insights and talk-to-listen ratios
- Keyword tracking across calls
- Searchable transcripts
- Topic detection and sentiment analysis
- Manager review workflows

### Recurring Revenue Tracking

- Track MRR and ARR across deal pipelines
- Automatic categorization: new, renewal, upgrade, downgrade, churn
- Revenue waterfall reporting
- Integration with subscription line items

### Advanced Forecasting

- Breeze AI-powered predictions alongside manual forecasts
- At-risk account flagging based on engagement signals
- Forecast accuracy tracking over time
- Team and individual forecast rollups
- Historical trend analysis

---

## 3. Service Hub Enterprise

**Pricing:** $150/seat/mo, 10-seat minimum. Onboarding: $3,500 (required).

### Enterprise-Only Features

| Feature | Available in Pro? | Enterprise Detail |
|---|---|---|
| Conditional SLAs | No | Rules based on source, pipeline, priority, team |
| Breeze AI Agents | Limited | Autonomous resolution across chat, email, voice, social |
| Conversation intelligence | No | Call transcription, AI coaching |
| Skill-based routing | No | Route tickets by agent expertise |
| IVR (Interactive Voice Response) | No | Multi-level phone menus |
| Custom objects | No | Up to 10 definitions |
| Hierarchical teams | No | Nested parent/child |
| SSO | No | SAML 2.0 |
| Admin notifications management | No | Push notification preferences |

### Key Limits

| Resource | Enterprise Limit |
|---|---|
| Ticket pipelines | 50 |
| Stages per pipeline | 100 |
| Knowledge bases | 25 |
| Knowledge base articles | 10,000 |
| Custom reports | 500 |
| SLA rules | Custom conditional |
| Help desk workspaces | Multiple |

### Conditional SLAs

- Set different response/resolution times based on:
  - Ticket source (email, chat, phone, form)
  - Pipeline
  - Priority level
  - Assigned team
- Escalation workflows when SLA breached
- SLA performance reporting

### Breeze AI Agents

- Autonomous ticket resolution without human intervention
- Channels: chat, email, voice, social media
- Knowledge base-powered responses
- Handoff to human agents when confidence is low
- Performance analytics and resolution rate tracking

---

## 4. Content Hub Enterprise (formerly CMS Hub)

**Pricing:** $1,500/mo base, includes 5 core seats.

### Enterprise-Only Features

| Feature | Available in Pro? | Enterprise Detail |
|---|---|---|
| Adaptive testing | No | Up to 5 page variants, ML optimization |
| Memberships | No | Gated content for registered users |
| Multi-domain | No | Up to 10 root domains |
| Content partitioning | No | Segment content by team |
| Reverse proxy | No | Serve HubSpot content from external domains |
| Custom CDN | No | BYO CDN configuration |
| Code alerts | No | Notifications for code issues |
| Activity logging | No | Track content changes |

### HubDB (Structured Data)

- Up to 10,000 rows per table
- Up to 10 dynamic pages per table
- Maximum 10 `hubdb_table_rows` calls per page render
- Column types: text, rich text, number, date, URL, image, video, select, multi-select, boolean, location, currency, foreign ID
- API access for CRUD operations
- Real-time publishing (no page rebuild required)

### Serverless Functions

- **Migration note:** Being migrated to `hubspot.fetch()` model
- Execution timeout: 10 seconds
- Maximum payload: 6MB
- Execution budget: 600 execution-seconds per minute
- Supported runtimes: Node.js
- Secrets management available
- Use cases: form processing, API proxying, custom integrations

### HubL Templating

- HubSpot's proprietary templating language
- Variables, filters, functions, tags
- Template inheritance and includes
- Conditional logic and loops
- Dynamic content rendering
- Access to CRM data, HubDB, and custom modules

---

## 5. Operations Hub Enterprise (now Data Hub)

**Pricing:** $2,000/mo base.

### Enterprise-Only Features

| Feature | Available in Pro? | Enterprise Detail |
|---|---|---|
| Datasets | No | 50 reusable curated data sets for reporting |
| Snowflake data share | No | 15-min refresh, no API quota impact |
| Advanced custom reports | No | 3,500 limit |
| Advanced workflows | No | 1,100 total |

### Key Limits

| Resource | Enterprise Limit |
|---|---|
| Datasets | 50 |
| Workflows | 1,100 |
| Custom reports | 3,500 |
| Data sync connectors | 100+ bidirectional |

### Custom Code Actions (in Workflows)

- Languages: JavaScript (Node.js 16.x) or Python 3.9
- Execution timeout: 20 seconds
- Memory limit: 128MB
- Output limit: 65,000 characters
- Secrets management for API keys and credentials
- NPM packages available (axios, lodash, @hubspot/api-client, etc.)
- Automatic retries for 3 days on 429/5XX errors

### Data Quality Tools

- AI-detected formatting issues (capitalization, phone formats, dates)
- Auto-fix rules with preview before applying
- Duplicate management with ML-powered detection
- Property validation rules

### Data Sync

- 100+ bidirectional connectors out of the box
- Field mapping with custom transformations
- Selective sync with filter rules
- Historical sync for initial data load
- Real-time or scheduled sync modes

### Snowflake Data Share

- Direct SQL access to HubSpot data in your Snowflake instance
- 15-minute data refresh cycle
- No impact on API rate limits
- Includes data points not available via REST API
- Requires Snowflake account (separate cost)

---

## 6. Commerce Hub

**Pricing:** Not a traditional subscription hub -- consumption-based pricing.

### Core Capabilities

- **Invoices:** Create, send, track payment status
- **Payment links:** Embeddable, shareable checkout pages
- **Quotes:** CPQ functionality with line items and approval workflows
- **Subscriptions:** Recurring billing management
- **Stripe integration:** Use existing Stripe account with HubSpot

### Payment Processing Fees

| Method | HubSpot Payments | Stripe via HubSpot |
|---|---|---|
| Credit/debit card | 2.9% | Stripe rates apply |
| ACH bank transfer | 1% (capped at $10) | Stripe rates apply |
| Platform fee | 0.5% | 0.75% (uncapped) |

### AI-Powered CPQ

- Breeze Closing Agent for quote generation
- Product library with pricing rules
- Discount approval workflows
- E-signature integration
- Revenue recognition support

---

## 7. Cross-Hub Enterprise Features

### Custom Objects

- Up to 10 custom object definitions per account
- Up to 500,000 records per custom object
- Full association support with all standard and custom objects
- Available in workflows, reports, lists, and record pages
- Schema defined via API or UI
- Properties, associations, and pipelines supported

### Calculated Properties

- **Limit:** 200 per account
- **Custom equation properties:** Arithmetic (+, -, *, /), comparison, logical operators, conditional (IF/THEN)
- **Rollup properties:** Min, max, sum, average, count across associated records
- **Time-based calculations:** Date differences, time since/until
- **Cross-object:** Calculate values from associated records
- **Update frequency:** Recalculated on property change (not real-time for rollups)

### Hierarchical Teams

- Maximum 300 teams
- Nested parent/child structure (up to 5 levels recommended)
- Asymmetric visibility: parent teams see child team data, not vice versa
- Used in: reporting, content partitioning, record ownership, permissions
- Team-based assignment rules in workflows

### Partitioning (Content & Asset Segmentation)

Partition these assets by team:
- CTAs, Forms, Emails, Lists, Workflows
- Dashboards, Blog posts, Pages, HubDB tables
- Users see only assets assigned to their team(s)
- Super admins see all content regardless of partition

### Sandboxes

- 1 sandbox included with any Enterprise hub
- Additional sandboxes: $750/mo each
- **Syncable items:** Contacts (sample), forms, lists, emails, pipelines, themes, workflows, custom properties
- **Not synced:** Actual contact/company/deal data, integrations, API keys
- Deploy changes from sandbox back to production
- Useful for testing workflow logic, template changes, and automation

### Single Sign-On (SSO)

- SAML 2.0 protocol
- Supported providers: Okta, Azure AD, OneLogin, ADFS, Google Workspace, and any SAML 2.0 compliant IdP
- Enforce SSO for all non-super-admin users
- Just-in-time user provisioning available

### Field-Level Permissions

- Three access levels per property per user/team:
  - **View and edit:** Full access
  - **View only:** Can see but not modify
  - **No access:** Property hidden entirely
- Applied at the team or individual user level
- Overrides default property visibility
- Useful for sensitive data (revenue, compensation, compliance fields)

### Permission Sets

- Custom role templates combining multiple permissions
- Assign to users for consistent access control
- Predefined templates available (Sales Rep, Marketing Manager, etc.)
- Editable and duplicatable

### Business Units / Brands

- **Availability:** Marketing Hub Enterprise add-on
- Up to 100 brands per account
- Each brand gets: separate domain, branding kit, email subscription preferences, email footer
- Shared CRM database across all brands
- Brand-specific reporting
- Contact association to specific brands

---

## 8. Data Model

### Standard Objects

| Object | Description |
|---|---|
| Contacts | People in your database |
| Companies | Organizations |
| Deals | Revenue opportunities |
| Tickets | Service requests |
| Products | Items/services you sell |
| Line Items | Products attached to deals/quotes |
| Quotes | Formal pricing proposals |
| Conversations | Chat/email threads |

### Custom Objects (Enterprise Only)

- Up to 10 definitions
- Full CRUD via API and UI
- Pipelines and stages supported
- Properties (up to ~1,000 custom per object)
- Associations with all object types

### Associations

- **Labels:** Up to 50 per object pair
- **Types:** Single labels (one-directional) and pair labels (bidirectional with distinct names)
- **Usage:** Lists, workflows, reports, record pages
- **Default associations:** Contact-Company, Deal-Contact, Deal-Company, Ticket-Contact, etc.
- **Custom associations:** Define any object-to-object relationship

### Properties

- **Limit:** ~1,000 custom properties per object
- **Types:** Single-line text, multi-line text, number, date, date+time, dropdown select, radio select, multiple checkboxes, single checkbox, calculation, rollup, file, rich text, HTML, score
- **Property groups:** Organize properties into logical sections
- **Conditional logic:** Show/hide properties based on enumeration property values
- **Sensitive properties:** Mark as sensitive for GDPR/compliance

### Record Customization

- **Left sidebar:** Up to 50 cards (association cards, activity cards, custom cards)
- **Middle column:** Up to 5 tabs, 50 cards per tab, 24 properties per section
- **Right sidebar:** Activity feed, associations, attachments
- **Conditional sections:** Show/hide based on record properties

### Data Import

- **File format:** CSV
- **File limits:** 1,048,576 rows or 512MB per file (whichever is smaller)
- **API import:** Up to 80M rows per day
- **Matching:** Email (contacts), domain (companies), or unique ID
- **Deduplication:** Automatic on email/domain during import

### Lists

- **Active lists:** Auto-update as contacts meet/leave criteria
- **Static lists:** Manual membership, does not auto-update
- **Filters per segment:** Up to 250
- **Associated object filters:** Up to 60
- **Refresh rate:** Active lists re-evaluate periodically (not instant for large lists)

---

## 9. Workflows & Automation

### Workflow Types

| Type | Trigger Object |
|---|---|
| Contact-based | Contact records |
| Company-based | Company records |
| Deal-based | Deal records |
| Ticket-based | Ticket records |
| Quote-based | Quote records |
| Custom object-based | Custom object records (Ops Hub) |
| Conversation-based | Conversation threads |
| Feedback-based | Survey submissions |
| Scheduled | Time-based (cron-style) |

### Trigger Types

- **Event-based:** Form submission, page view, email interaction, meeting booked, etc.
- **Filter-based:** Property value changes, list membership, association changes
- **Scheduled:** Run at specific times (daily, weekly, monthly)
- **Webhook-based:** External system triggers (Ops Hub)
- **Manual:** Enroll records manually or via API

### Available Actions

- Send email (marketing or transactional)
- Create task, deal, ticket, or record
- Set, copy, or clear property value
- If/then branching (up to 250 branches)
- Delays (time-based, until date, until event)
- Webhook (POST/GET to external URL)
- Custom code (JS Node.js 16.x or Python 3.9)
- Rotate records (round-robin assignment)
- List management (add/remove from static list)
- Internal notifications (email, in-app, SMS)
- Enroll in another workflow
- Goal criteria (exit workflow when met)

### Custom Code Actions

- **Languages:** JavaScript (Node.js 16.x) or Python 3.9
- **Timeout:** 20 seconds
- **Memory:** 128MB
- **Output limit:** 65,000 characters
- **Secrets:** Managed secrets for API credentials (do not hardcode)
- **NPM packages:** axios, lodash, @hubspot/api-client, and others
- **Retries:** Automatic retry for 3 days on HTTP 429 or 5XX responses
- **Use cases:** API calls, data transformation, complex logic, external system integration

### Re-enrollment

- Must be explicitly enabled per workflow
- Activity-based properties (e.g., "last email open date") cannot trigger re-enrollment
- Contact can only be re-enrolled after completing or being removed from the workflow
- Useful for recurring processes (renewal reminders, periodic check-ins)

### Limits

| Tier | Workflow Limit |
|---|---|
| Enterprise | 1,000 |
| Enterprise + Ops Hub | 1,100 |
| Professional | 300 |
| Professional + Ops Hub | 400 |

- Action log retained for 90 days
- Maximum enrolled records varies by action complexity
- Workflow execution is asynchronous (not guaranteed instant)

---

## 10. Reporting & Analytics

### Report Types

| Report Type | Minimum Tier |
|---|---|
| Single object | Free+ |
| Cross-object | Professional |
| Funnel reports | Professional |
| Custom events funnel | Enterprise |
| Attribution reports | Marketing Enterprise |

### Attribution Models (Marketing Enterprise)

- First Touch, Last Touch, Linear, U-Shaped, W-Shaped, Full-Path, Custom
- Content attribution: which pages/assets influence conversions
- Revenue attribution: tie marketing touchpoints to closed revenue
- Custom model: define your own weighting across touchpoints

### Dashboards

- Maximum 50 dashboards per account
- Up to 20 reports per dashboard
- Enterprise: team-based access control on dashboards
- Clone and share functionality
- Scheduled email delivery of dashboard snapshots

### Datasets (Ops Hub Enterprise)

- Up to 50 reusable dataset definitions
- Curated, pre-joined data for consistent reporting
- Data joins across objects
- Calculated fields within datasets
- Used as data source for custom reports

### Analytics Tools

- **Traffic analytics:** Source, topic, page performance, UTM tracking
- **Campaign analytics:** Compare up to 10 campaigns side by side
- **Sales analytics:** Pipeline velocity, deal win rate, rep performance
- **Service analytics:** Ticket volume, resolution time, SLA compliance, CSAT/NPS
- **Marketing analytics suite (2025):** Unified marketing performance dashboard

### Custom Report Limits

| Hub | Enterprise Limit |
|---|---|
| Marketing Hub | 500 |
| Sales Hub | 500 |
| Service Hub | 500 |
| Operations Hub | 3,500 |

---

## 11. API & Developer Platform

### Authentication

- **Private app tokens:** Single-account access, scoped permissions, simplest setup
- **OAuth 2.0:** Multi-account access, required for marketplace apps, refresh token flow
- **API keys:** DEPRECATED -- migrate to private app tokens

### Rate Limits

| Tier | Daily Limit | Burst Limit |
|---|---|---|
| Enterprise | 1,000,000 requests/day | 190 requests/10 seconds |
| Professional | 650,000 requests/day | 190 requests/10 seconds |
| Free/Starter | 250,000 requests/day | 100 requests/10 seconds |

- Burst limit is per private app
- Daily limit is shared across all private apps in the account
- 429 response when exceeded; retry with exponential backoff

### Core APIs

| API | Key Operations |
|---|---|
| CRM Objects | CRUD for all standard and custom objects |
| Properties | Create, read, update, delete properties |
| Associations | Create, read, delete associations and labels |
| Pipelines | Manage deal/ticket pipelines and stages |
| Marketing Email | Send transactional emails, manage templates |
| CMS | Pages, blog posts, HubDB, files, modules |
| Workflows | Enroll/unenroll, read workflow details |
| Webhooks | Subscribe to CRM events (create, update, delete) |
| Custom Objects Schema | Define and manage custom object schemas |
| Custom Events | Send behavioral events (1,250 requests/sec) |
| Import | Bulk import via CSV (80M rows/day) |
| Search | Filter, sort, query CRM records |

### Snowflake Data Share

- SQL access to HubSpot data in your Snowflake instance
- 15-minute data refresh cycle
- No impact on API rate limits or daily quota
- Includes data points not available via REST API
- Requires Ops Hub Enterprise

### Developer Tools

- **HubSpot CLI:** Local development, deploy themes/modules/functions
- **Developer sandbox:** Free account for development and testing
- **CRM Cards:** Custom UI cards on record pages (iframes or serverless)
- **App Marketplace:** Publish public apps for all HubSpot users
- **UI Extensions:** React-based custom cards (CRM record pages, help desk)

---

## 12. Integrations

### Salesforce Integration

- Bidirectional sync (contacts, companies, deals, tasks, and more)
- Field mapping with custom rules
- Selective sync with inclusion/exclusion lists
- Custom object sync (Enterprise beta)
- Field-level governance recommended to prevent data conflicts
- Sync errors dashboard and notifications
- Campaign sync for attribution

### Microsoft 365

- Email tracking and logging
- Calendar sync (meetings appear in CRM)
- Teams integration for notifications
- SharePoint file attachments (limited)

### Google Workspace

- Gmail sidebar and tracking
- Google Calendar sync
- Google Sheets data sync
- Google Meet integration for meetings

### Slack

- Deal/ticket notifications in channels
- Create and manage tasks from Slack
- Record unfurling (paste HubSpot link, see preview)
- Slash commands for quick CRM lookups

### Data Sync (Ops Hub)

- 100+ bidirectional connectors (Mailchimp, Zendesk, NetSuite, etc.)
- Field mapping with transformations
- Filter rules for selective sync
- Historical sync for initial setup
- Conflict resolution rules (most recent wins, HubSpot always wins, etc.)

### Custom Integration Approaches

- **Private apps:** For single-account internal integrations
- **OAuth apps:** For multi-account or marketplace distribution
- **Webhooks:** Real-time event notifications from HubSpot
- **Custom code in workflows:** Quick integration logic without separate infrastructure

### iPaaS Platforms

| Platform | Best For |
|---|---|
| Zapier | Simple, no-code automations |
| Make (Integromat) | Complex visual workflows |
| Workato | Enterprise-grade orchestration |
| n8n | Self-hosted, open source |

---

## 13. Administration

### User Management

- Roles with granular permissions (CRM, Marketing, Sales, Service, Account, Reports)
- Permission sets (Enterprise): reusable role templates
- Teams and hierarchical teams (Enterprise)
- Super admins: full access, manage all settings
- Seat types: Core seats vs. view-only seats

### Branding

- Brand kit: colors, fonts, logos, favicons
- Email footers: one per account (Pro), multiple (Enterprise)
- Business units: separate branding per brand (Marketing Enterprise add-on)

### Audit Logs

| Log Type | Retention |
|---|---|
| Login activity | 30 days |
| Domain changes | 90 days |
| Permission changes | 90 days |
| Workflow changes | 90 days |
| Security activity (Enterprise) | 90 days with advanced filtering |

### GDPR & Privacy

- Cookie consent banners (customizable)
- Lawful basis tracking per contact (legitimate interest, consent, contract, etc.)
- Permanent deletion of contact data (hard delete)
- Subscription preferences and opt-out management
- Data retention policies (auto-delete after X days)
- Right to access / data portability exports

### Presets (Enterprise)

- Push default navigation, notification, and homepage preferences to user groups
- Standardize user experience across teams
- Super admin controlled

---

## 14. HubSpot Academy Certifications

### Key Certifications for Enterprise Admins

| Certification | Focus Area |
|---|---|
| Revenue Operations | Cross-functional alignment, data governance |
| Integrating with HubSpot | API, data sync, custom integrations |
| Marketing Hub Software | Campaign execution, automation, reporting |
| Sales Hub Software | Pipeline management, sequences, forecasting |
| Service Hub Software | Ticket management, knowledge base, SLAs |
| CMS for Developers | HubL, themes, modules, serverless functions |
| Inbound Marketing | Methodology, content strategy, lead nurturing |
| Data Management | Property hygiene, imports, data quality |

### Super Admin Bootcamp

- Recommended for admins with 6+ months HubSpot experience
- Covers advanced configuration, troubleshooting, optimization
- Includes hands-on exercises and peer learning

---

## 15. Financial Services Patterns

### CRM Configuration

- **Custom deal stages:** Prospect, Discovery, Proposal, AUM Onboarding, Active Client
- **Custom properties:** AUM, custodian, risk tolerance, investment horizon, fee schedule
- **Deal amount:** Map to AUM or expected annual revenue

### Custom Objects for Financial Services

- **Portfolios:** Track individual portfolio performance, allocation, custodian
- **Custodian relationships:** Map clients to custodians (Schwab, Fidelity, Pershing, etc.)
- **Household groupings:** Link related contacts (spouses, dependents, trusts)
- **Financial plans:** Track plan versions, review dates, recommendations

### Workflow Patterns

- **Client onboarding:** Multi-step automation from signed agreement to account opening
- **Quarterly review scheduling:** Automated outreach based on last review date
- **AUM milestones:** Trigger tasks/notifications at AUM thresholds
- **Birthday/anniversary:** Automated personal touch campaigns
- **Compliance reminders:** Document expiration, KYC renewal, form ADV updates

### Compliance Considerations

- Role-based permissions to restrict access to sensitive financial data
- Audit trails for all record changes and communications
- Email archiving integrations (Smarsh, Global Relay, etc.)
- **NOT purpose-built for SEC/FINRA compliance** -- supplement with specialized compliance tools
- Books and records retention requires third-party archiving

### Migration from Redtail CRM

- **HubSpot Marketplace:** Redtail data sync app available (check current status)
- **CSV export/import:** Most reliable migration path
- **Matching key:** Email address as primary matching key
- **Data mapping:** Redtail categories to HubSpot properties, activity types, custom fields
- **Considerations:** Redtail's activity/note structure differs from HubSpot's timeline model

---

## 16. Items to Verify

These items had conflicting information across sources. Check the official Product & Services Catalog at legal.hubspot.com/hubspot-product-and-services-catalog:

- **Exact list limits for Enterprise (active/static):** Some sources say 1,500 each, others cite 2,000. Verify current limits.
- **Professional tier dashboard and team limits:** Varies across documentation. Confirm dashboard count and team hierarchy depth.
- **Custom object limit:** Most sources say 10 definitions. Newer API documentation references up to 20. Confirm current maximum.
- **Business Units add-on exact pricing:** Pricing varies by contract. Check current rates.
- **Commerce Hub CPQ tier requirements:** Which features require which tier is inconsistent across sources.
- **BigQuery integration:** Some documentation mentions BigQuery alongside Snowflake. Verify availability and tier requirements.
- **Serverless functions migration timeline:** The transition to `hubspot.fetch()` model is ongoing. Check current state.
- **Breeze AI feature availability:** Breeze features are rolling out progressively. Verify which are GA vs. beta.

---

## Sources

All information sourced from:

- **knowledge.hubspot.com** -- Official knowledge base articles
- **developers.hubspot.com** -- API documentation, developer guides, changelog
- **hubspot.com/products** -- Product pages, pricing, feature comparisons
- **academy.hubspot.com** -- Certifications, courses, learning paths
- **legal.hubspot.com/hubspot-product-and-services-catalog** -- Official limits and entitlements
- **community.hubspot.com** -- Product updates, feature announcements, user discussions
- **Third-party HubSpot partner analyses:** StreamCreative, CRO:NYX Digital, Forecom Solutions, Aptitude 8, New Breed, SmartBug Media, and others
