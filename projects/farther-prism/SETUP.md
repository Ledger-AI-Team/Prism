# Farther Prism - GCP Setup Guide

**Account:** Ledger.OpenClaw@Gmail.com  
**Platform:** Google Cloud Platform  
**Initial Budget:** ~$7K/month Phase 1

---

## Step 1: Create GCP Project

1. Go to https://console.cloud.google.com
2. Sign in with `Ledger.OpenClaw@Gmail.com`
3. Click **Select a project** → **New Project**
   - Project name: `Farther Prism`
   - Project ID: `farther-prism` (or auto-generated)
   - Organization: None (or Farther if you have one)
4. Click **Create**

---

## Step 2: Enable Billing

1. Go to **Billing** in left menu
2. Link a payment method
3. Set budget alerts:
   - $500/month (initial testing)
   - $2,000/month (when we deploy services)
   - $7,000/month (Phase 1 target)

---

## Step 3: Enable Required APIs

Navigate to **APIs & Services** → **Enable APIs and Services**

Enable these:
- ✅ Cloud Run API
- ✅ Cloud SQL Admin API
- ✅ Cloud Storage API
- ✅ Cloud Build API
- ✅ Secret Manager API
- ✅ Cloud Logging API
- ✅ Cloud Monitoring API
- ✅ IAM API
- ✅ Cloud Functions API (for automation)

---

## Step 4: Set Up IAM Service Accounts

**For automated deployments:**

1. Go to **IAM & Admin** → **Service Accounts**
2. Create service account:
   - Name: `prism-deployer`
   - Role: **Editor** (or custom with Cloud Run Admin, Cloud SQL Admin, Storage Admin)
3. Create key (JSON)
4. Save securely (I'll need this for automated deployments)

---

## Step 5: Create Initial Resources

### Cloud Storage Buckets

```bash
# Documents (IPS, proposals, reports)
gsutil mb -l us-west1 gs://farther-prism-documents

# Backup archives (7-year retention)
gsutil mb -l us-west1 -c ARCHIVE gs://farther-prism-archives
```

### Cloud SQL (PostgreSQL - for compliance logs)

1. Go to **SQL** → **Create Instance**
2. Choose **PostgreSQL**
3. Configuration:
   - Instance ID: `prism-compliance-db`
   - Password: (generate strong password, save to Secret Manager)
   - Region: `us-west1` (Oregon - close to Phoenix)
   - Machine type: **Shared core** (1 vCPU, 1.7 GB) for testing
   - Storage: 10 GB SSD, enable auto-increase
   - **Enable automated backups** (7 days retention)
   - **Enable point-in-time recovery** (required for SEC compliance)

### CockroachDB Cloud (Separate from GCP)

1. Go to https://cockroachlabs.cloud
2. Create account with `Ledger.OpenClaw@Gmail.com`
3. Create cluster:
   - Name: `prism-client-graph`
   - Cloud: **GCP**
   - Region: **us-west1**
   - Plan: **Serverless** (free tier for testing, scales automatically)

---

## Step 6: Deploy First Service (Monte Carlo Engine)

I'll provide a `Dockerfile` and deployment script. For now, just verify:
- Project created ✅
- Billing enabled ✅
- APIs enabled ✅
- Storage buckets created ✅

---

## Security Baseline (Critical)

### Enable These Now:

1. **2-Factor Authentication** for the Gmail account
2. **Organization Policy** (if you create a GCP org):
   - Require OS Login for VMs
   - Restrict public IP access
3. **Secret Manager** for all credentials (never hardcode)
4. **VPC Service Controls** (once we have production data)

### Network Security:

- All services in **private subnets** (no public IPs except load balancers)
- Cloud SQL: **Private IP only** (no public access)
- Storage: **Uniform bucket-level access** + IAM policies

---

## Cost Estimates (Phase 1)

| Service | Configuration | Monthly Cost |
|---------|---------------|--------------|
| Cloud Run (API services) | 2 services, ~1M requests | $50 |
| Cloud SQL PostgreSQL | db-custom-1-3840 | $120 |
| CockroachDB Serverless | <10 GB, moderate usage | $0-50 |
| Cloud Storage | 50 GB documents + egress | $10 |
| Cloud Logging | Standard tier | $20 |
| BigQuery (analytics) | 100 GB | $50 |
| **Total (minimal usage)** | | **~$250/mo** |

Scales to ~$2K/mo with production traffic (1K clients).

---

## Next Steps After Setup

Once project is created and billing enabled:

1. **Send me the project ID** (e.g., `farther-prism-401923`)
2. **Grant me access** (Ledger.OpenClaw@Gmail.com as Project Editor)
3. I'll deploy:
   - Monte Carlo API (Cloud Run)
   - Initial database schemas
   - Infrastructure-as-code (Terraform configs)

---

## Questions?

Contact: Ledger (OpenClaw session)

**Timeline:** ~30 minutes to complete Steps 1-5, then I can take over.
