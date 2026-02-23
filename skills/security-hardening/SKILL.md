# Security Hardening

**Name:** security-hardening
**Description:** Enterprise-grade security architecture for financial platforms covering defense-in-depth, encryption, access control, compliance, and continuous testing.

## Defense-in-Depth Layers
CloudFlare WAF (DDoS/bot mitigation) → Load Balancer (TLS termination, rate limiting) → **Web Tier** (public subnet, CSP enforced) → **API Tier** (private subnet, mTLS) → **Data Tier** (isolated subnet, no internet egress, VPC endpoints only)

## Encryption Strategy
- **At Rest:** AES-256-GCM, FIPS 140-3 validated modules, per-tenant keys
- **In Transit:** TLS 1.3 exclusively (no fallback), certificate pinning for mobile clients
- **In Use:** Confidential Computing via Intel TDX / AMD SEV-SNP for sensitive workloads
- **Selective:** Homomorphic Encryption for cross-party analytics without data exposure
- **PII:** Tokenization with format-preserving encryption; original values never leave the vault

## Key Management — Envelope Encryption
HSM (FIPS 140-3 Level 3) holds Master Encryption Key (MEK) → MEK wraps Data Encryption Keys (DEKs) → DEKs encrypt actual data. 90-day automatic key rotation. Key destruction follows NIST SP 800-88 guidelines.

## Data Classification
| Tier | Examples | Protection | Access |
|------|----------|------------|--------|
| 0 — Restricted | SSN, passwords, keys | AES-256 + HSM, zero-knowledge proofs | Named individuals, break-glass only |
| 1 — Confidential | Account balances, PII | AES-256 + field-level encryption | Role-based, audit-logged |
| 2 — Internal | Trade history, configs | AES-256 at rest, TLS in transit | Team-scoped, need-to-know |
| 3 — Sensitive | Aggregated analytics | Encrypted at rest, TLS in transit | Department-level |
| 4 — Public | Market data, pricing | TLS in transit | Authenticated API consumers |

## Authentication & Authorization
- **Protocol:** OAuth 2.0 / OIDC with PKCE for all clients
- **Tokens:** JWT RS256, 15-minute access token TTL, rotating refresh tokens
- **MFA:** FIDO2/WebAuthn as primary; YubiKey hardware tokens mandatory for admin roles
- **Model:** RBAC (role-based) + ABAC (attribute-based) hybrid; policy engine evaluates both

## Content Security Policy
`default-src none; script-src nonce-{random}; style-src self; img-src self data:; font-src self; connect-src self api.*; frame-ancestors none; base-uri none; form-action self;`

## OWASP Top 10 Mitigations
1. **Broken Access Control** — enforce server-side, deny by default, ABAC on every endpoint
2. **Cryptographic Failures** — AES-256-GCM, no MD5/SHA1, secrets never in code
3. **Injection** — parameterized queries only, input validation at gateway, ORM enforcement
4. **Insecure Design** — threat modeling every sprint, abuse-case testing, secure defaults
5. **Security Misconfiguration** — infrastructure-as-code with policy gates, no defaults in production
6. **Vulnerable Components** — automated dependency scanning (Snyk/Dependabot), 48-hour critical patch SLA
7. **Auth Failures** — credential stuffing protection, bcrypt/Argon2id, account lockout with progressive delay
8. **Data Integrity Failures** — signed artifacts, SBOM for every release, CI/CD pipeline integrity checks
9. **Logging/Monitoring Failures** — centralized SIEM, tamper-proof audit logs, real-time alerting
10. **SSRF** — allowlist outbound destinations, no raw URL fetching, DNS rebinding protection

## Secrets Management
HashiCorp Vault Enterprise with auto-unseal via cloud KMS. Dynamic secrets for all database credentials (no static passwords). TLS certificates issued with 24-hour TTL via Vault PKI backend. Application identity via Vault AppRole with CIDR binding.

## Security Testing Cadence
Weekly: SAST (Semgrep/CodeQL) + DAST (ZAP/Burp) in CI | Monthly: Dependency/container scanning, license audit | Quarterly: External penetration test (CREST-certified) | Annually: Red team engagement (assumed breach scenario) | Ongoing: Bug bounty program (HackerOne, $500-$25K payouts)

## Compliance Framework
SOC 2 Type II (continuous) | ISO 27001 (certified) | SEC Regulation S-P and S-ID | FINRA cybersecurity rules | GDPR (EU data subjects) | CCPA/CPRA (California residents) | PCI DSS v4.0 (card data handling)
