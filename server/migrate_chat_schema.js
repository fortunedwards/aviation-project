const db = require('./config/db');

const migrate = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id BIGSERIAL PRIMARY KEY,
        room_id TEXT NOT NULL,
        student_id TEXT,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        started_by TEXT,
        started_by_role TEXT,
        started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ended_by TEXT,
        ended_by_role TEXT,
        ended_at TIMESTAMPTZ
      )
    `);

    await db.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_sessions_one_active_per_room
      ON chat_sessions (room_id)
      WHERE active = TRUE
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS chat_room_reads (
        id BIGSERIAL PRIMARY KEY,
        room_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        last_read_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (room_id, user_id)
      )
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_room_reads_user_room
      ON chat_room_reads (user_id, room_id)
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS chat_guest_contacts (
        id BIGSERIAL PRIMARY KEY,
        room_id TEXT NOT NULL UNIQUE,
        guest_token TEXT NOT NULL,
        guest_sender_id UUID,
        guest_name TEXT NOT NULL,
        guest_email TEXT NOT NULL,
        guest_phone TEXT NOT NULL,
        linked_student_user_id UUID REFERENCES student_users(id) ON DELETE SET NULL,
        linked_admission_status TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      ALTER TABLE chat_guest_contacts
      ADD COLUMN IF NOT EXISTS guest_sender_id UUID
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_guest_contacts_email
      ON chat_guest_contacts (LOWER(guest_email))
    `);

    console.log('Chat schema migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Chat schema migration failed:', error.message);
    process.exit(1);
  }
};

migrate();
