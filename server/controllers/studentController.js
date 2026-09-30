const db = require('../config/db');
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
                c.outline AS course_outline, c.form_fee
            FROM student_users s
            JOIN applications a ON s.application_id = a.id
            JOIN courses c ON a.course_id = c.id
            WHERE s.id = $1
        `;

        const result = await db.query(query, [studentUserId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Profile not found" });
        }

        const profile = result.rows[0];

        // Calendar information enriches the dashboard, but must never stop a
        // student from accessing their profile if the calendar table is still
        // awaiting a migration or has legacy data.
        try {
            const nextEvent = await db.query(`
                SELECT event_date, end_date, start_time, end_time, location
                FROM calendar_events
                WHERE course_id::text = $1
                  AND category = 'Course'
                  AND event_date >= CURRENT_DATE
                ORDER BY event_date ASC, start_time ASC NULLS LAST
                LIMIT 1
            `, [String(profile.course_id)]);
            Object.assign(profile, {
                next_event_date: nextEvent.rows[0]?.event_date || null,
                next_event_end_date: nextEvent.rows[0]?.end_date || null,
                next_event_start_time: nextEvent.rows[0]?.start_time || null,
                next_event_end_time: nextEvent.rows[0]?.end_time || null,
                next_event_location: nextEvent.rows[0]?.location || null,
            });
        } catch (calendarError) {
            console.warn('Student calendar enrichment skipped:', calendarError.message);
        }

        res.status(200).json({ success: true, data: profile });
    } catch (err) {
        console.error("Profile Fetch Error:", err.message);
        res.status(500).json({ error: err.message || "Unable to load the student profile." });
    }
};
