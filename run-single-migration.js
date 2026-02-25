#!/usr/bin/env node
/**
 * Run a single migration file.
 * Usage: node run-single-migration.js migrations/007_proposify_schema.sql
 */

import 'dotenv/config';
import pool from './src/db/pool.js';
import fs from 'fs';

const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Usage: node run-single-migration.js <migration-file>');
  process.exit(1);
}

console.log(`🚀 Running migration: ${migrationFile}\n`);

const sql = fs.readFileSync(migrationFile, 'utf-8');

try {
  await pool.query(sql);
  console.log('✅ Migration complete!\n');
  process.exit(0);
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}
