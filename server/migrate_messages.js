const db = require('./config/db');

const migrate = async () => {
  try {
    await db.query(`
      ALTER TABLE messages ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'sent';
    `);
    console.log('✅ Migration complete: status column added to messages');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    process.exit();
  }
};

migrate();
