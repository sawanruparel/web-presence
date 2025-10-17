-- Migration: Initial Schema for Access Control System
-- Created: 2025-10-17
-- Description: Creates core tables for content access control, email allowlists, and audit logging

-- ============================================================
-- TABLE: content_access_rules
-- Purpose: Define access control for each content item
-- ============================================================
CREATE TABLE IF NOT EXISTS content_access_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Content identification
  type TEXT NOT NULL,                    -- 'notes', 'publications', 'ideas', 'pages'
  slug TEXT NOT NULL,                    -- unique identifier within type
  
  -- Access control
  access_mode TEXT NOT NULL DEFAULT 'open', -- 'open', 'password', 'email-list'
  description TEXT,                      -- human-readable description
  
  -- Password storage (only for password mode)
  password_hash TEXT,                    -- bcrypt hash of password
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure one rule per content
  UNIQUE(type, slug)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_access_rules_type_slug ON content_access_rules(type, slug);
CREATE INDEX IF NOT EXISTS idx_access_rules_mode ON content_access_rules(access_mode);

-- ============================================================
-- TABLE: email_allowlist
-- Purpose: Email addresses allowed for email-list access mode
-- ============================================================
CREATE TABLE IF NOT EXISTS email_allowlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Link to access rule
  access_rule_id INTEGER NOT NULL,
  
  -- Email address (stored in lowercase for case-insensitive comparison)
  email TEXT NOT NULL,
  
  -- Metadata
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY(access_rule_id) REFERENCES content_access_rules(id) ON DELETE CASCADE,
  UNIQUE(access_rule_id, email)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_allowlist_rule ON email_allowlist(access_rule_id);
CREATE INDEX IF NOT EXISTS idx_allowlist_email ON email_allowlist(email);

-- ============================================================
-- TABLE: access_logs
-- Purpose: Audit trail of all access attempts
-- ============================================================
CREATE TABLE IF NOT EXISTS access_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Content identification
  access_rule_id INTEGER,                -- NULL for open content
  type TEXT NOT NULL,
  slug TEXT NOT NULL,
  
  -- Access result
  access_granted BOOLEAN NOT NULL,       -- TRUE if access granted, FALSE if denied
  
  -- Credential used (for audit, never log actual passwords!)
  credential_type TEXT,                  -- 'password', 'email', 'none'
  credential_value TEXT,                 -- email address only (NOT password)
  
  -- Request metadata
  ip_address TEXT,
  user_agent TEXT,
  
  -- Timestamp
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY(access_rule_id) REFERENCES content_access_rules(id) ON DELETE SET NULL
);

-- Indexes for analytics and monitoring
CREATE INDEX IF NOT EXISTS idx_access_logs_timestamp ON access_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_access_logs_type_slug ON access_logs(type, slug);
CREATE INDEX IF NOT EXISTS idx_access_logs_granted ON access_logs(access_granted);
CREATE INDEX IF NOT EXISTS idx_access_logs_credential ON access_logs(credential_value);

-- ============================================================
-- INITIAL DATA (Optional seed data)
-- ============================================================
-- Note: Actual data will be migrated from access-control.json
-- This is kept empty for now, migration script will populate it
