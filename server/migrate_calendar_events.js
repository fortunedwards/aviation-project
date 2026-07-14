const db = require('./config/db');

const migrateCalendarEvents = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS calendar_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        category VARCHAR(40) NOT NULL DEFAULT 'Other',
        event_date DATE NOT NULL,
        end_date DATE,
        start_time TIME,
        end_time TIME,
        is_all_day BOOLEAN NOT NULL DEFAULT FALSE,
        location VARCHAR(255),
        description TEXT,
        created_by TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events (event_date)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_calendar_events_category ON calendar_events (category)`);

    console.log('Calendar events migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Calendar events migration failed:', err.message);
    process.exit(1);
  }
};

migrateCalendarEvents();
