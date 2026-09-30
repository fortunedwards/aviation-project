const db = require('../config/db');
const { logAction } = require('../utils/logger');

exports.getStudentProfile = async (req, res) => {
    try {
        // req.user.id comes from the student_users table (via Auth Middleware)
        const studentUserId = req.user.id;

        const query = `
            SELECT
                s.id AS student_user_id,
                a.id AS application_id,
                a.surname, a.other_names, a.email, a.phone, a.address,
                a.admission_status, a.payment_status, a.payment_ref,
                a.course_fee, a.instructor_remarks, a.submitted_at,
                a.passport_url, a.certificate_url,
                c.id AS course_id, c.title AS course_name, c.slug AS course_slug,
                c.duration AS course_duration, c.course_description,
                c.outline AS course_outline, c.form_fee,
                next_event.event_date AS next_event_date,
                next_event.end_date AS next_event_end_date,
                next_event.start_time AS next_event_start_time,
                next_event.end_time AS next_event_end_time,
                next_event.location AS next_event_location
            FROM student_users s
            JOIN applications a ON s.application_id = a.id
            JOIN courses c ON a.course_id = c.id
            LEFT JOIN LATERAL (
                SELECT event_date, end_date, start_time, end_time, location
                FROM calendar_events
                WHERE course_id = c.id
                  AND category = 'Course'
                  AND event_date >= CURRENT_DATE
                ORDER BY event_date ASC, start_time ASC NULLS LAST
                LIMIT 1
            ) next_event ON TRUE
            WHERE s.id = $1
        `;

        const result = await db.query(query, [studentUserId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Profile not found" });
        }

        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error("Profile Fetch Error:", err.message);
        res.status(500).json({ error: "Server error fetching profile" });
    }
};
