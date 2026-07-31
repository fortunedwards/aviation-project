const fs = require('fs');
const path = require('path');
const db = require('./config/db');

const coursesPath = path.join(__dirname, '..', 'client', 'src', 'data', 'courses.json');

async function main() {
  const raw = fs.readFileSync(coursesPath, 'utf8');
  const parsed = JSON.parse(raw);
  const courses = Array.isArray(parsed.courses) ? parsed.courses : [];
  const priceByTitle = new Map(courses.map((course) => [course.title, course.price]));

  const columnResult = await db.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'courses'
      AND column_name IN ('course_fee', 'fee_amount')
  `);

  const columns = columnResult.rows.map((row) => row.column_name);
  if (columns.length === 0) {
    throw new Error("No supported course price column found. Expected 'course_fee' or 'fee_amount'.");
  }

  const courseResult = await db.query('SELECT id, title FROM courses');
  const updates = courseResult.rows
    .map((row) => ({
      id: row.id,
      title: row.title,
      price: priceByTitle.get(row.title),
    }))
    .filter((row) => typeof row.price === 'number');

  if (updates.length === 0) {
    console.log('No matching courses found to update.');
    return;
  }

  await db.query('BEGIN');
  try {
    for (const row of updates) {
      const setters = columns.map((column, index) => `${column} = $${index + 1}`);
      const params = [...columns.map(() => row.price), row.id];
      await db.query(`UPDATE courses SET ${setters.join(', ')} WHERE id = $${columns.length + 1}`, params);
    }

    await db.query('COMMIT');
    console.log(`Updated ${updates.length} course records.`);
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Course price migration failed:', error.message);
    process.exit(1);
  });
