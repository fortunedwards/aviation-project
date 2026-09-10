const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Using your existing db config
const { protect, authorize } = require('../middleware/authMiddleware');
const { logAction } = require('../utils/logger');

// GET /api/courses
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        id,
        title,
        form_fee,
        category,
        course_fee,
        course_fee AS price,
        duration,
        outline,
        course_description,
        created_at,
        slug
      FROM courses
      ORDER BY category DESC, title ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch courses" });
  }
});

// Public clients are read-only; only Accountable Managers can edit catalog data.
router.patch('/:id', protect, authorize('Manager'), async (req, res) => {
  const { title, form_fee, course_fee, duration } = req.body || {};
  const fees = [form_fee, course_fee];
  if (!String(title || '').trim() || !String(duration || '').trim() || fees.some((value) => !Number.isFinite(Number(value)) || Number(value) < 0)) {
    return res.status(400).json({ error: 'Title and duration are required; fees must be non-negative numbers.' });
  }

  try {
    const before = await db.query('SELECT id, title, form_fee, course_fee, duration FROM courses WHERE id = $1', [req.params.id]);
    if (!before.rows[0]) return res.status(404).json({ error: 'Course not found.' });
    const result = await db.query(
      `UPDATE courses SET title = $1, form_fee = $2, course_fee = $3, duration = $4 WHERE id = $5
       RETURNING id, title, form_fee, category, course_fee, course_fee AS price, duration, outline, course_description, created_at, slug`,
      [String(title).trim(), Number(form_fee), Number(course_fee), String(duration).trim(), req.params.id]
    );
    await logAction({ req, action: 'COURSE_UPDATED', description: `Updated course catalog details for ${result.rows[0].title}.`, targetType: 'course', targetId: result.rows[0].id, beforeState: before.rows[0], afterState: result.rows[0], statusCode: 200 });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Could not update course:', err);
    res.status(500).json({ error: 'Could not update course.' });
  }
});

module.exports = router;
