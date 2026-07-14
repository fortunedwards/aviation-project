const db = require('./config/db');

const runMigration = async () => {
  try {
    await db.query(`
      ALTER TABLE audit_logs
      ADD COLUMN IF NOT EXISTS metadata JSONB,
      ADD COLUMN IF NOT EXISTS actor_role TEXT,
      ADD COLUMN IF NOT EXISTS actor_type TEXT,
      ADD COLUMN IF NOT EXISTS actor_name TEXT,
      ADD COLUMN IF NOT EXISTS target_type TEXT,
      ADD COLUMN IF NOT EXISTS target_id TEXT,
      ADD COLUMN IF NOT EXISTS route TEXT,
      ADD COLUMN IF NOT EXISTS request_method TEXT,
      ADD COLUMN IF NOT EXISTS ip_address TEXT,
      ADD COLUMN IF NOT EXISTS user_agent TEXT,
      ADD COLUMN IF NOT EXISTS success BOOLEAN,
      ADD COLUMN IF NOT EXISTS status_code INTEGER,
      ADD COLUMN IF NOT EXISTS entity_before JSONB,
      ADD COLUMN IF NOT EXISTS entity_after JSONB
    `);

    await db.query(`
      UPDATE audit_logs
      SET
        actor_role = COALESCE(actor_role, metadata->>'actor_role'),
        actor_type = COALESCE(actor_type, metadata->>'actor_type'),
        actor_name = COALESCE(actor_name, metadata->>'actor_name'),
        target_type = COALESCE(target_type, metadata->>'target_type'),
        target_id = COALESCE(target_id, metadata->>'target_id'),
        route = COALESCE(route, metadata->>'route'),
        request_method = COALESCE(request_method, metadata->>'method'),
        ip_address = COALESCE(ip_address, metadata->>'ip_address'),
        user_agent = COALESCE(user_agent, metadata->>'user_agent'),
        success = COALESCE(success, NULLIF(metadata->>'success', '')::boolean),
        status_code = COALESCE(status_code, NULLIF(metadata->>'status_code', '')::integer),
        entity_before = COALESCE(entity_before, metadata->'entity_before'),
        entity_after = COALESCE(entity_after, metadata->'entity_after')
      WHERE metadata IS NOT NULL
    `);

    await db.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs (action_type)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_type ON audit_logs (actor_type)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_target_type_target_id ON audit_logs (target_type, target_id)`);

    console.log('Audit log migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Audit log migration failed:', error.message);
    process.exit(1);
  }
};

runMigration();
