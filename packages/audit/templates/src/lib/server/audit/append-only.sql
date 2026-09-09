-- SVForge audit — DB-level append-only enforcement (opt-in, #332).
--
-- The application API ($lib/server/audit) never updates or deletes rows, but
-- nothing stops another client (a migration, a psql session, a compromised
-- credential) from doing so. This script moves the guarantee INTO PostgreSQL:
--
--   1. a trigger refuses every UPDATE and DELETE on audit_logs;
--   2. purges stay possible through the explicit maintenance path below.
--
-- Apply ONCE per environment, with a migration tool or psql:
--   psql "$DATABASE_URL" -f src/lib/server/audit/append-only.sql
--
-- ⚠ Retention interplay (#332): with the trigger in place, `audit.purgeExpired()`
--   fails until the maintenance window below disables it. Plan retention and
--   the trigger together — do not enable one and forget the other.

-- ── 1. Refuse UPDATE and DELETE at the database level ─────────────────────

CREATE OR REPLACE FUNCTION svforge_audit_append_only() RETURNS trigger AS $$
BEGIN
	RAISE EXCEPTION 'audit_logs is append-only: % is blocked (see append-only.sql)', TG_OP
		USING ERRCODE = 'check_violation';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_logs_append_only ON audit_logs;

CREATE TRIGGER audit_logs_append_only
	BEFORE UPDATE OR DELETE ON audit_logs
	FOR EACH ROW EXECUTE FUNCTION svforge_audit_append_only();

-- ── 2. Maintenance window (retention purge) — run manually, as a distinct ──
-- ──    operator action, then RE-ENABLE immediately.                        ──
--
-- BEGIN;
--   ALTER TABLE audit_logs DISABLE TRIGGER audit_logs_append_only;
--   -- run the retention purge here (audit.purgeExpired() or equivalent SQL)
--   ALTER TABLE audit_logs ENABLE TRIGGER audit_logs_append_only;
-- COMMIT;
--
-- For stricter setups, run purges under a dedicated maintenance role that is
-- the only one allowed to disable the trigger:
--   REVOKE ... ; GRANT ALTER ON audit_logs TO svforge_maintenance;
