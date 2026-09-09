const bcrypt = require('bcryptjs');
const db = require('./config/db');

const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = String(process.env.ADMIN_PASSWORD || '');
const fullName = String(process.env.ADMIN_NAME || 'Funmi').trim();

const run = async () => {
  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required');
  }

  const existing = await db.query(
    'SELECT id, email, role FROM staff_accounts WHERE LOWER(email) = LOWER($1) LIMIT 1',
    [email]
  );

  if (existing.rows.length > 0) {
    console.log(`Account already exists for ${email}; no changes made.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const result = await db.query(
    `INSERT INTO staff_accounts (full_name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, full_name, email, role`,
    [fullName, email, passwordHash, 'Admin']
  );

  console.log(`Created admin account: ${result.rows[0].email}`);
};

run()
  .catch((error) => {
    console.error(`Admin account creation failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => db.end());
