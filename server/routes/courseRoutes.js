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
        slug,
        description,
        fee_amount AS form_fee,
        is_free
      FROM courses
      ORDER BY title ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch courses" });
  }
});

module.exports = router;
