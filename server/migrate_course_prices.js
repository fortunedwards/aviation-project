const fs = require('fs');
const path = require('path');
const db = require('./config/db');

const coursesPath = path.join(__dirname, 'data', 'courses.json');

async function main() {
  const raw = fs.readFileSync(coursesPath, 'utf8');
  const parsed = JSON.parse(raw);
  const frontendCourses = Array.isArray(parsed.courses) ? parsed.courses : [];

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

    const courseResult = await client.query(`
      SELECT id, title, category
      FROM courses
      ORDER BY created_at ASC, id ASC
    `);

    if (courseResult.rows.length !== frontendCourses.length) {
      throw new Error(
        `Course count mismatch: frontend has ${frontendCourses.length}, database has ${courseResult.rows.length}.`
      );
    }

    await client.query('BEGIN');
    try {
      for (let index = 0; index < frontendCourses.length; index += 1) {
        const frontendCourse = frontendCourses[index];
        const dbCourse = courseResult.rows[index];

        if (columns.has('category')) {
          await client.query(
            'UPDATE courses SET title = $1, category = $2, course_fee = $3 WHERE id = $4',
            [
              frontendCourse.title,
              frontendCourse.category || dbCourse.category || null,
              Number(frontendCourse.price ?? 0),
              dbCourse.id,
            ]
          );
        } else {
          await client.query('UPDATE courses SET title = $1, course_fee = $2 WHERE id = $3', [
            frontendCourse.title,
            Number(frontendCourse.price ?? 0),
            dbCourse.id,
          ]);
        }
      }

      await client.query('COMMIT');
      console.log(`Synced ${frontendCourses.length} courses from the frontend catalog.`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
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
