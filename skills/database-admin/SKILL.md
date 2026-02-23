---
name: database-admin
description: >
  PostgreSQL, MySQL, SQLite, MongoDB, Redis management.
metadata: {"openclaw":{"emoji":"🐘","requires":{"anyBins":["psql","mysql","mongosh","redis-cli","sqlite3"]}}}
---
# Database Admin
## When to Activate
- Database operations, queries, schema changes
- Performance tuning, slow queries, backups
## Diagnostics
- PostgreSQL: EXPLAIN ANALYZE, pg_stat_activity, VACUUM ANALYZE, pg_dump
- MySQL: SHOW PROCESSLIST, EXPLAIN, OPTIMIZE TABLE, mysqldump
- Redis: INFO memory, DBSIZE, MONITOR, --bigkeys
- MongoDB: db.stats(), explain(), getIndexes()
## Safety
ALWAYS confirm before DROP/DELETE/TRUNCATE/ALTER. Backup first.
