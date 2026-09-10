const db = require('./config/db');

async function main() {
  try {
    // Match the deployed courses.id type (some legacy environments use a
    // non-UUID identifier) before creating the relationship.
    await db.query(`
      DO $$
      DECLARE course_id_type TEXT;
      BEGIN
        SELECT format_type(a.atttypid, a.atttypmod) INTO course_id_type
        FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        WHERE c.relname = 'courses' AND a.attname = 'id' AND NOT a.attisdropped;
        EXECUTE format('ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS course_id %s', course_id_type);
      END $$;
    `);
    await db.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'calendar_events_course_id_fkey') THEN
          ALTER TABLE calendar_events ADD CONSTRAINT calendar_events_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);
    await db.query('CREATE INDEX IF NOT EXISTS idx_calendar_events_course_id ON calendar_events (course_id)');
    console.log('Calendar course links migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Calendar course links migration failed:', error.message);
    process.exit(1);
  }
}

main();
