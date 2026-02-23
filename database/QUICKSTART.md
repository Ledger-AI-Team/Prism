# Farther Prism Database - Quick Start Guide

Get the database running in under 5 minutes.

---

## Prerequisites

- Docker & Docker Compose (recommended)  
  **OR**
- PostgreSQL 15+ installed locally

---

## Option 1: Docker (Recommended)

### 1. Start Database

```bash
cd database
docker-compose up -d
```

This will:
- Start PostgreSQL 15
- Run all schema migrations automatically
- Create sample household (optional)

### 2. Verify

```bash
docker-compose ps
```

You should see:
```
farther_prism_db    Up (healthy)
```

### 3. Connect

```bash
# Using psql
docker-compose exec postgres psql -U prism_api -d farther_prism

# Or use connection string
postgresql://prism_api:changeme@localhost:5432/farther_prism
```

### 4. Load Seed Data (Optional)

```bash
docker-compose exec postgres psql -U prism_api -d farther_prism -f /docker-entrypoint-initdb.d/04-seed-data.sql
```

### 5. Stop

```bash
docker-compose down
```

To delete all data:
```bash
docker-compose down -v
```

---

## Option 2: Local PostgreSQL

### 1. Set Environment Variables

```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials
```

### 2. Run Deployment Script

```bash
./deploy.sh
```

This will:
- Create database
- Run all migrations
- Optionally load seed data

### 3. Verify

```bash
psql -U prism_api -d farther_prism -c "\dt"
```

You should see 40+ tables.

---

## Optional: pgAdmin

For a GUI database client:

```bash
docker-compose --profile admin up -d
```

Access at: http://localhost:5050
- Email: admin@farther.com
- Password: admin

Add server:
- Host: postgres
- Port: 5432
- Username: prism_api
- Password: changeme

---

## Optional: Redis (for caching)

If you need Redis for caching plan runs:

```bash
docker-compose --profile full up -d
```

Redis will be available at: localhost:6379

---

## Verify Schema

### Check Tables

```bash
docker-compose exec postgres psql -U prism_api -d farther_prism -c "\dt"
```

Expected output: 40+ tables

### Check Views

```bash
docker-compose exec postgres psql -U prism_api -d farther_prism -c "\dv"
```

Expected output: 6 views

### Check Functions

```bash
docker-compose exec postgres psql -U prism_api -d farther_prism -c "\df"
```

Expected output: 6+ functions

### Sample Query

```bash
docker-compose exec postgres psql -U prism_api -d farther_prism -c "SELECT * FROM v_household_summary LIMIT 5;"
```

---

## Connection Strings

### Application (Node.js)

```javascript
// Using pg library
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // OR
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});
```

### Application (Prisma)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Application (TypeORM)

```typescript
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false,
  logging: true,
  entities: ['src/entities/**/*.ts'],
});
```

---

## Common Commands

### Access Database

```bash
# Docker
docker-compose exec postgres psql -U prism_api -d farther_prism

# Local
psql -U prism_api -d farther_prism
```

### Backup Database

```bash
# Docker
docker-compose exec postgres pg_dump -U prism_api farther_prism > backup.sql

# Local
pg_dump -U prism_api farther_prism > backup.sql
```

### Restore Database

```bash
# Docker
cat backup.sql | docker-compose exec -T postgres psql -U prism_api -d farther_prism

# Local
psql -U prism_api -d farther_prism < backup.sql
```

### Reset Database

```bash
# Drop and recreate
docker-compose down -v
docker-compose up -d
```

---

## Performance Tuning

### Check Slow Queries

```sql
SELECT 
    query,
    calls,
    total_time / 1000 AS total_seconds,
    mean_time / 1000 AS mean_seconds
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;
```

### Check Index Usage

```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
    AND schemaname = 'public'
ORDER BY idx_tup_read DESC;
```

### Check Table Sizes

```sql
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Troubleshooting

### Connection Refused

```bash
# Check if container is running
docker-compose ps

# Check logs
docker-compose logs postgres

# Restart
docker-compose restart postgres
```

### Extension Not Found

```sql
-- Install missing extensions manually
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
```

### Permission Denied

```bash
# Ensure you're using the correct user
docker-compose exec postgres psql -U prism_api -d farther_prism

# Check role permissions
SELECT * FROM pg_roles WHERE rolname = 'prism_api';
```

### Port Already in Use

```bash
# Change port in .env
DB_PORT=5433

# Or stop conflicting service
sudo service postgresql stop
```

---

## Next Steps

1. **Connect Application**
   - Update `DATABASE_URL` in your .env
   - Test connection from your Node.js app

2. **Load Production Data**
   - Import custodial account data
   - Import household information
   - Import historical positions

3. **Set Up Monitoring**
   - Enable pg_stat_statements
   - Set up query logging
   - Configure alerts

4. **Configure Backups**
   - Set up automated backups (daily)
   - Configure WAL archiving
   - Test restore procedure

---

## Resources

- **Schema Documentation:** `README.md`
- **ERD Diagram:** `ERD.md`
- **Migration Guide:** `migrations/README.md`
- **API Docs:** `../api/README.md`

---

## Support

Questions or issues?

- **Email:** Ledger@The-AI-Team.io
- **GitHub:** https://github.com/Ledger-AI-Team/Prism
- **Docs:** https://docs.farther.com/prism

---

**Last Updated:** February 23, 2026
