const db = require('./config/db');

const createTables = async () => {
  const queryText = `
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Drop types if they exist to avoid errors on re-run
    DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('student', 'admin', 'instructor', 'manager');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL, -- Added VARCHAR(255) here
        password_hash TEXT NOT NULL,
        role user_role DEFAULT 'student',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS courses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        fee_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        is_free BOOLEAN DEFAULT FALSE
    );

    CREATE TABLE IF NOT EXISTS applications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
        admission_status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
        amount_paid DECIMAL(12, 2) NOT NULL,
        transaction_ref VARCHAR(100) UNIQUE,
        payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await db.query(queryText);
    console.log("✅ All tables (Users, Courses, Apps, Payments) created successfully!");
    process.exit();
  } catch (err) {
    console.error("❌ Error creating tables:", err);
    process.exit(1);
  }
};

createTables();