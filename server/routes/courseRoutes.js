const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Using your existing db config

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
        created_at,
        LOWER(REGEXP_REPLACE(title, '[^a-z0-9]+', '-', 'g')) AS slug
      FROM courses
      ORDER BY category DESC, title ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch courses" });
  }
});

module.exports = router;
