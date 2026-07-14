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
      conditions.push(`event_date >= $${values.length}`);
    }

    if (to) {
      values.push(to);
      conditions.push(`event_date <= $${values.length}`);
    }

    if (upcomingOnly === 'true') {
      conditions.push(`event_date >= CURRENT_DATE`);
    }

    if (category && category !== 'ALL') {
      values.push(normalizeCategory(category));
      conditions.push(`category = $${values.length}`);
    }

    if (q) {
      values.push(`%${String(q).trim()}%`);
      conditions.push(`(
        title ILIKE $${values.length}
        OR COALESCE(location, '') ILIKE $${values.length}
        OR COALESCE(description, '') ILIKE $${values.length}
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
        id,
        title,
        category,
        event_date,
        end_date,
        start_time,
        end_time,
        is_all_day,
        location,
        description,
        created_by,
        created_at
      FROM calendar_events
      ${whereClause}
      ORDER BY event_date ASC, start_time ASC NULLS LAST, created_at DESC
      ${limitClause}
    `;

    const result = await db.query(query, values);
    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Calendar events fetch error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to load calendar events' });
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
    } = req.body;

    if (!title || !event_date) {
      return res.status(400).json({ success: false, error: 'Title and event date are required.' });
    }

    const normalizedCategory = normalizeCategory(category);

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
        created_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING id, title, category, event_date, end_date, start_time, end_time, is_all_day, location, description, created_by, created_at
      `,
      [
        title,
        normalizedCategory,
        event_date,
        end_date || null,
        start_time || null,
        end_time || null,
        Boolean(is_all_day),
        location || null,
        description || null,
        req.user?.id || null,
      ]
    );

    await logAction({
      req,
      userId: req.user.id,
      actorRole: req.user.role,
      action: 'CALENDAR_EVENT_CREATED',
      description: `Created calendar event: ${title}`,
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
