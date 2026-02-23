# Troubleshooting Master Reference

## OpenClaw Errors

| Error | Cause | Fix |
|---|---|---|
| gateway token mismatch | Docker env stale | Remove OPENCLAW_GATEWAY_TOKEN, restart |
| agent.* was moved | Config schema changed | openclaw doctor --fix |
| model not allowed | Cron model restriction | Check agents.defaults.model |
| pairing required | Device token mismatch | Re-pair via /setup |
| PID lock timeout | Gateway already running | pkill -f openclaw, restart |
| Port 18789 dead | Gateway crashed | openclaw gateway restart |
| Skills not loading | Wrong path | Check ~/.openclaw/workspace/skills/ |
| Memory gone | SQLite corruption | openclaw doctor --fix |

## Railway Errors

| Error | Fix |
|---|---|
| Build timeout | Add cache, increase timeout |
| OOM killed | Increase memory in railway.toml |
| Health check fail | Verify healthcheckPath and PORT |
| Volume mount fail | Reattach in Railway UI |
| Deploy stuck | railway logs, check startCommand |

## Docker Exit Codes

| Code | Meaning | Fix |
|---|---|---|
| 0 | Clean exit | Normal |
| 1 | App error | Check logs for stack trace |
| 137 | OOM killed | Increase memory |
| 139 | Segfault | Check binary compatibility |
| 143 | Graceful SIGTERM | Normal shutdown |
| 127 | Command not found | Verify binary in container |

## Database Errors

| Error | Fix |
|---|---|
| connection refused | Verify service + host:port |
| too many connections | Increase max_connections or pgBouncer |
| relation does not exist | Run migrations, check search_path |
| deadlock detected | Fix transaction ordering, add retry |
| disk full | VACUUM FULL, archive, increase volume |
| slow query | EXPLAIN ANALYZE, add index |
