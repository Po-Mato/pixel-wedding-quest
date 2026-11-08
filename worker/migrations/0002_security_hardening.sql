-- Security Hardening Migration: D1-backed Rate Limiting & Brute-Force Protection
CREATE TABLE IF NOT EXISTS rate_limits (
  rate_key TEXT PRIMARY KEY,
  hit_count INTEGER NOT NULL DEFAULT 1,
  window_start_ms INTEGER NOT NULL,
  blocked_until_ms INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_window
  ON rate_limits (window_start_ms);
