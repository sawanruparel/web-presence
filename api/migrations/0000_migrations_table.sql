-- Migration: Migrations Tracking Table
-- Created: 2026-01-26
-- Description: Creates table for tracking applied database migrations
-- This should be run FIRST before any other migrations

-- ============================================================
-- TABLE: schema_migrations
-- Purpose: Track which migrations have been applied
-- ============================================================
CREATE TABLE IF NOT EXISTS schema_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Migration identification
  migration_name TEXT NOT NULL UNIQUE,  -- e.g., '0001_initial_schema'
  migration_file TEXT NOT NULL,          -- Full filename
  
  -- Execution metadata
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  applied_by TEXT,                       -- User/system that applied it
  execution_time_ms INTEGER,             -- How long it took to apply
  
  -- Migration details
  description TEXT,                      -- Description from migration file
  checksum TEXT                          -- Optional: hash of migration file for verification
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_migrations_name ON schema_migrations(migration_name);
CREATE INDEX IF NOT EXISTS idx_migrations_applied_at ON schema_migrations(applied_at DESC);
