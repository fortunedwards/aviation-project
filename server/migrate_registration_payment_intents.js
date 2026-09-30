const db = require('./config/db');

async function main() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS registration_payment_intents (
        reference VARCHAR(120) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        course_id TEXT NOT NULL,
        registration_data JSONB NOT NULL,
        passport_url TEXT NOT NULL,
        certificate_url TEXT,
        amount NUMERIC(12, 2) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'pending',
        application_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMPTZ
      )
    `);
    await db.query('CREATE INDEX IF NOT EXISTS idx_registration_payment_intents_email_status ON registration_payment_intents (email, status)');
    console.log('Registration payment intents migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Registration payment intents migration failed:', error.message);
    process.exit(1);
  }
}

main();
