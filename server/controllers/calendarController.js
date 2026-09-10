const db = require('../config/db');
const { logAction } = require('../utils/logger');

const EVENT_CATEGORIES = ['Course', 'Holiday', 'Meeting', 'Exam', 'Operations', 'Other'];

const normalizeCategory = (value) => {
  if (!value) return 'Other';
  const matched = EVENT_CATEGORIES.find((item) => item.toLowerCase() === String(value).toLowerCase());
  return matched || 'Other';
};

exports.getCalendarEvents = async (req, res) => {
  try {
    const { from, to, q, category, upcomingOnly, limit } = req.query;
    const conditions = [];
    const values = [];

    if (from) {
      values.push(from);
      conditions.push(`e.event_date >= $${values.length}`);
    }

    if (to) {
      values.push(to);
      conditions.push(`e.event_date <= $${values.length}`);
    }

    if (upcomingOnly === 'true') {
      conditions.push(`e.event_date >= CURRENT_DATE`);
    }

    if (category && category !== 'ALL') {
      values.push(normalizeCategory(category));
      conditions.push(`e.category = $${values.length}`);
    }

    if (q) {
      values.push(`%${String(q).trim()}%`);
      conditions.push(`(
        e.title ILIKE $${values.length}
        OR COALESCE(e.location, '') ILIKE $${values.length}
        OR COALESCE(e.description, '') ILIKE $${values.length}
      )`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    let limitClause = '';
    if (limit) {
      values.push(Number(limit));
      limitClause = `LIMIT $${values.length}`;
    }

    const query = `
      SELECT
        e.id,
        e.title,
        e.category,
        e.event_date,
        e.end_date,
        e.start_time,
        e.end_time,
        e.is_all_day,
        e.location,
        e.description,
        e.course_id,
        c.slug AS course_slug,
        e.created_by,
        e.created_at
      FROM calendar_events e
      LEFT JOIN courses c ON c.id = e.course_id
      ${whereClause}
      ORDER BY e.event_date ASC, e.start_time ASC NULLS LAST, e.created_at DESC
      ${limitClause}
    `;

    const result = await db.query(query, values);
    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Calendar events fetch error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to load calendar events' });
  }
};

// Deliberately limited public feed: only upcoming event information, never
// creator metadata or internal dashboard fields.
exports.getPublicCalendarEvents = async (_req, res) => {
  try {
    const result = await db.query(`
      SELECT e.id, e.title, e.category, e.event_date, e.end_date, e.start_time, e.end_time, e.is_all_day, e.location, e.description, c.slug AS course_slug
      FROM calendar_events e
      LEFT JOIN courses c ON c.id = e.course_id
      WHERE e.event_date >= CURRENT_DATE
      ORDER BY e.event_date ASC, e.start_time ASC NULLS LAST, e.created_at DESC
      LIMIT 100
    `);
    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Public calendar events fetch error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to load training calendar.' });
  }
};

exports.createCalendarEvent = async (req, res) => {
  try {
    const {
      title,
      category,
      event_date,
      end_date,
      start_time,
      end_time,
      is_all_day,
      location,
      description,
      course_id,
    } = req.body;

    if (!event_date) {
      return res.status(400).json({ success: false, error: 'Title and event date are required.' });
    }

    const normalizedCategory = normalizeCategory(category);
    let eventTitle = String(title || '').trim();
    let linkedCourseId = null;
    if (normalizedCategory === 'Course') {
      if (!course_id) return res.status(400).json({ success: false, error: 'Select a course for a Course event.' });
      const courseResult = await db.query('SELECT id, title FROM courses WHERE id = $1', [course_id]);
      if (!courseResult.rows[0]) return res.status(400).json({ success: false, error: 'The selected course was not found.' });
      linkedCourseId = courseResult.rows[0].id;
      eventTitle = courseResult.rows[0].title;
    }
    if (!eventTitle) return res.status(400).json({ success: false, error: 'Title and event date are required.' });

    const created = await db.query(
      `
      INSERT INTO calendar_events (
        title,
        category,
        event_date,
        end_date,
        start_time,
        end_time,
        is_all_day,
        location,
        description,
        course_id,
        created_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING id, title, category, event_date, end_date, start_time, end_time, is_all_day, location, description, course_id, created_by, created_at
      `,
      [
        eventTitle,
        normalizedCategory,
        event_date,
        end_date || null,
        start_time || null,
        end_time || null,
        Boolean(is_all_day),
        location || null,
        description || null,
        linkedCourseId,
        req.user?.id || null,
      ]
    );

    await logAction({
      req,
      userId: req.user.id,
      actorRole: req.user.role,
      action: 'CALENDAR_EVENT_CREATED',
      description: `Created calendar event: ${eventTitle}`,
      metadata: {
        event_id: created.rows[0].id,
        event_category: normalizedCategory,
        event_date,
      },
      targetType: 'calendar_event',
      targetId: created.rows[0].id,
      statusCode: 201,
    });

    res.status(201).json({ success: true, data: created.rows[0] });
  } catch (err) {
    console.error('Calendar event creation error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to create calendar event' });
  }
};

exports.getCalendarCategories = async (_req, res) => {
  res.status(200).json({ success: true, data: EVENT_CATEGORIES });
};
