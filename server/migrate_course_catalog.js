const fs = require('fs');
const path = require('path');
const db = require('./config/db');
const { buildTitleResolver, normalizeTitle } = require('./course_title_aliases');

const catalogPath = path.join(__dirname, 'data', 'courses.json');
const slugify = (value) => String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

async function main() {
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const jsonCourses = Array.isArray(catalog.courses) ? catalog.courses : [];
  const byTitle = new Map(jsonCourses.map((course) => [normalizeTitle(course.title), course]));
  const resolveTitle = buildTitleResolver(jsonCourses.map((course) => course.title));
  const client = await db.connect();

  try {
    await client.query('BEGIN');
    await client.query(`
      ALTER TABLE courses
        ADD COLUMN IF NOT EXISTS form_fee DECIMAL(12, 2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS category VARCHAR(255),
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS course_fee DECIMAL(12, 2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS slug VARCHAR(255),
        ADD COLUMN IF NOT EXISTS duration TEXT,
        ADD COLUMN IF NOT EXISTS outline JSONB NOT NULL DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS course_description TEXT
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const alreadyApplied = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', ['course_catalog_v1']);
    if (alreadyApplied.rows.length > 0) {
      await client.query('COMMIT');
      console.log('Course catalog migration already applied.');
      return;
    }

    const existing = await client.query('SELECT id, title, slug FROM courses ORDER BY created_at ASC, id ASC');
    const matchedTitles = new Set();
    for (const row of existing.rows) {
      const matchedTitle = resolveTitle(row.title);
      const course = matchedTitle ? byTitle.get(normalizeTitle(matchedTitle)) : null;
      if (course) {
        await client.query(
          `UPDATE courses SET title = $1, slug = $2, category = $3, course_fee = $4, duration = $5, outline = $6::jsonb, course_description = $7 WHERE id = $8`,
          [course.title, course.slug || slugify(course.title), course.category || null, Number(course.price || 0), course.duration || null, JSON.stringify(course.outline || []), course.course_description || null, row.id]
        );
        matchedTitles.add(normalizeTitle(matchedTitle));
      } else {
        await client.query("UPDATE courses SET slug = COALESCE(NULLIF(slug, ''), $1) WHERE id = $2", [slugify(row.title), row.id]);
      }
    }

    for (const course of jsonCourses) {
      if (matchedTitles.has(normalizeTitle(course.title))) continue;
      await client.query(
        `INSERT INTO courses (title, slug, form_fee, category, course_fee, duration, outline, course_description) VALUES ($1, $2, 0, $3, $4, $5, $6::jsonb, $7)`,
        [course.title, course.slug || slugify(course.title), course.category || null, Number(course.price || 0), course.duration || null, JSON.stringify(course.outline || []), course.course_description || null]
      );
    }

    // Legacy records can share a title. Keep the first URL unchanged and give
    // subsequent records a deterministic, unique URL suffix before indexing.
    const slugRows = await client.query(`
      SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at ASC, id ASC) AS position
      FROM courses
      WHERE slug IS NOT NULL AND slug <> ''
    `);
    for (const row of slugRows.rows) {
      if (Number(row.position) > 1) {
        await client.query('UPDATE courses SET slug = $1 WHERE id = $2', [`${row.slug}-${String(row.id).replace(/-/g, '').slice(0, 8)}`, row.id]);
      }
    }
    await client.query('CREATE UNIQUE INDEX IF NOT EXISTS courses_slug_unique_idx ON courses (slug) WHERE slug IS NOT NULL');
    await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', ['course_catalog_v1']);
    await client.query('COMMIT');
    console.log(`Course catalog migration complete: ${existing.rows.length} existing records processed, ${jsonCourses.length - matchedTitles.size} courses added.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

main().then(() => process.exit(0)).catch((error) => { console.error('Course catalog migration failed:', error.message); process.exit(1); });
