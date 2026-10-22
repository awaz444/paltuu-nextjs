-- audit_logs was referenced by the login route (PALTU-20) but never created —
-- 019_add_login_tracking.sql only added users.last_login_at. Every
-- /api/v1/auth/login call failed on the INSERT until this table existed.

BEGIN;

CREATE TABLE IF NOT EXISTS audit_logs (
  audit_log_id BIGSERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON audit_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created ON audit_logs(action, created_at);

COMMIT;
