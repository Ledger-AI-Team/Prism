---
name: railway-deploy
description: >
  Deploy and manage apps on Railway. Projects, services, databases, domains.
metadata: {"openclaw":{"emoji":"🚂","requires":{"bins":["railway"]}}}
---
# Railway Deployment
## When to Activate
- Deploying to Railway or managing Railway services
- Database provisioning, env vars, domains, volumes
## Quick Reference
- railway login/init/link
- railway up (-d for background)
- railway variables set/list
- railway add (databases)
- railway logs/status/domain
- railway run/shell (local dev with env)
## Safety
Env vars for secrets. Test locally first. Separate staging/prod.
