# Platform Architect

**Name:** platform-architect
**Description:** Design and evaluate cloud-based financial services platforms using a three-layer AI-native architecture with enterprise-grade infrastructure patterns.

## Three-Layer Architecture
- **Intelligence Layer (AI/ML):** Model inference, portfolio optimization, NLP, anomaly detection, recommendation engines
- **Execution Layer (Services):** Auth, Portfolio (construction/rebalancing/optimization), Market Data (real-time/historical/alternative), Analytics (backtesting/Monte Carlo/risk/attribution), Billing, Reporting, Compliance, AI/ML Inference
- **Data Layer (Infrastructure):** Streaming pipelines, multi-model databases, feature stores, object storage, caching

## Core Principles
AI-Native (ML in every decision path) | Event-Driven (Kafka backbone, async-first) | Zero-Trust (never trust, always verify) | Composable (microservices, plugin architecture) | Observability-First (OpenTelemetry, distributed tracing) | Compliance-as-Code (policy engines, automated audit trails)

## Technology Stack
- **API/Backend:** FastAPI (external REST) + Rust (latency-critical paths), gRPC (internal service mesh)
- **API Gateway:** GraphQL with Apollo Federation for client-facing aggregation
- **Event Streaming:** Kafka (event backbone) → Flink (stream processing) + Spark (batch) → Snowflake (warehouse)
- **Database Matrix:** Aurora PostgreSQL (transactional), TimescaleDB (time-series), MongoDB (documents/configs), Redis (cache/sessions), Snowflake (analytics), Elasticsearch (search/logs), Neptune (graph/relationships), Feast (feature store)

## Data Architecture — Lambda Pattern
Ingestion (Kafka) splits into two paths: **Stream** (Flink, sub-second latency, real-time dashboards) and **Batch** (Spark, hourly/daily, historical analytics). Both merge into Snowflake serving layer with materialized views.

## Frontend Stack
- **Framework:** Next.js 15 (App Router, RSC) + React 19 (concurrent features, use() hook)
- **Language:** TypeScript strict mode, no `any` escape hatches
- **UI:** Tailwind CSS + shadcn/ui component library, design tokens for theming
- **Visualization:** D3.js (2D charts/graphs), Three.js (3D portfolio visualization), WebAssembly (client-side computation offload)

## Performance Targets
| Metric | Target | Measurement |
|--------|--------|-------------|
| First Contentful Paint | < 0.8s | Lighthouse CI |
| Largest Contentful Paint | < 1.2s | Core Web Vitals |
| Time to Interactive | < 2.0s | Real User Monitoring |

## Disaster Recovery
- **RTO:** < 15 minutes (automated failover, health-check driven)
- **RPO:** < 1 minute (synchronous replication for critical data, async for analytics)
- **Strategy:** Multi-region active-passive with automated promotion; quarterly DR drills with chaos engineering validation

## When Applying This Skill
1. Start with the three-layer diagram to frame any architecture discussion.
2. Map each business requirement to a specific service in the Execution layer.
3. Select databases from the matrix based on access pattern, not familiarity.
4. Validate every design decision against the six core principles.
5. Benchmark frontend changes against the three performance targets before merging.
