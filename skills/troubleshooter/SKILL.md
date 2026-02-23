---
name: troubleshooter
description: >
  Systematic troubleshooting for any issue. Always active.
metadata: {"openclaw":{"emoji":"🔧","always":true}}
---
# Troubleshooter
## When to Activate
- ANY error, failure, or "not working" report
- Error messages or stack traces
## DIRECT Protocol
1. DEFINE expected vs actual
2. ISOLATE what changed
3. RESEARCH logs/docs/issues
4. EXECUTE least-risky fix first
5. CONFIRM fix + no regression
6. TRACK for future
## Quick Diagnostics
openclaw status --all | openclaw doctor --fix | docker ps -a
journalctl -xe --since "30 min ago" | ss -tulpn | free -h && df -h
