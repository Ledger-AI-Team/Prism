---
name: docker-ops
description: >
  Docker containers, images, compose, troubleshooting.
metadata: {"openclaw":{"emoji":"🐳","requires":{"bins":["docker"]}}}
---
# Docker Operations
## When to Activate
- Docker containers, images, compose, networking
- Container failures or performance issues
## Troubleshooting Order
1. docker ps -a (exit codes)
2. docker logs --tail 200
3. docker stats (OOM?)
4. docker inspect
5. docker exec shell in
## Exit Codes
0=clean, 1=error, 137=OOM, 139=segfault, 143=SIGTERM
