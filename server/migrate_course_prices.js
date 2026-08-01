const fs = require('fs');
const path = require('path');
const db = require('./config/db');

const coursesPath = path.join(__dirname, 'data', 'courses.json');

const toSlug = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

async function main() {
  const raw = fs.readFileSync(coursesPath, 'utf8');
  const parsed = JSON.parse(raw);
  const frontendCourses = Array.isArray(parsed.courses) ? parsed.courses : [];

  const frontendBySlug = new Map(
    frontendCourses.map((course) => [
      course.slug || toSlug(course.title),
      {
        title: course.title,
        category: course.category || null,
        courseFee: Number(course.price ?? 0),
      },
    ])
  );

  const client = await db.connect();

  try {
    const columnResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'courses'
        AND column_name IN ('id', 'title', 'category', 'course_fee')
    `);

    const columns = new Set(columnResult.rows.map((row) => row.column_name));

    if (!columns.has('id') || !columns.has('title') || !columns.has('course_fee')) {
      throw new Error("The courses table must include at least 'id', 'title', and 'course_fee'.");
    }

    const courseResult = await client.query('SELECT id, title FROM courses ORDER BY title ASC');
    const updates = [];
    const unmatched = [];

    for (const row of courseResult.rows) {
      const rowSlug = toSlug(row.title);
      const frontendCourse = frontendBySlug.get(rowSlug);

      if (!frontendCourse) {
        unmatched.push(row.title);
        continue;
      }

      updates.push({
        id: row.id,
        title: frontendCourse.title,
        category: frontendCourse.category,
        courseFee: frontendCourse.courseFee,
      });
    }

    if (updates.length === 0) {
      console.log('No matching courses found to update.');
      return;
    }

    if (unmatched.length > 0) {
      throw new Error(`Some DB rows did not match the frontend catalog (${unmatched.length} unmatched).`);
    }

    await client.query('BEGIN');
    try {
      for (const course of updates) {
        if (columns.has('category')) {
          await client.query('UPDATE courses SET title = $1, category = $2, course_fee = $3 WHERE id = $4', [
            course.title,
            course.category,
            course.courseFee,
            course.id,
          ]);
        } else {
          await client.query('UPDATE courses SET title = $1, course_fee = $2 WHERE id = $3', [
            course.title,
            course.courseFee,
            course.id,
          ]);
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }

    console.log(`Synced ${updates.length} course records from the frontend catalog.`);
  } finally {
    client.release();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Course sync failed:', error.message);
    process.exit(1);
  });
