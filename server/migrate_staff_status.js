const db = require('./config/db');

const migrateStaffStatus = async () => {
  try {
    await db.query(`
      ALTER TABLE staff_accounts
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Active'
    `);

    await db.query(`
      UPDATE staff_accounts
      SET status = 'Active'
      WHERE status IS NULL
    `);

    console.log('✅ Migration complete: status column ensured on staff_accounts');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to migrate staff status column:', err);
    process.exit(1);
  }
};

migrateStaffStatus();
