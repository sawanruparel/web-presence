-- Migration: Build Logs Table
-- Created: 2026-01-26
-- Description: Creates table for tracking build logs and history

-- ============================================================
-- TABLE: build_logs
-- Purpose: Track build execution history and logs
-- ============================================================
CREATE TABLE IF NOT EXISTS build_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Build identification
  build_type TEXT NOT NULL,              -- 'web', 'api', 'full'
  status TEXT NOT NULL,                  -- 'success', 'failed', 'in_progress'
  
  -- Timing
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  duration_seconds INTEGER,              -- Calculated from started_at and completed_at
  
  -- Build output
  log_output TEXT,                       -- Build log output/stderr
  error_message TEXT,                    -- Error message if failed
  
  -- Build metadata
  triggered_by TEXT,                     -- 'manual', 'ci', 'webhook', 'api'
  git_commit_sha TEXT,                   -- Git commit SHA if available
  git_branch TEXT,                       -- Git branch if available
  
  -- Timestamp
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_build_logs_started_at ON build_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_build_logs_status ON build_logs(status);
CREATE INDEX IF NOT EXISTS idx_build_logs_build_type ON build_logs(build_type);
