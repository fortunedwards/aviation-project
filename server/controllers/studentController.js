const db = require('../config/db');
const { logAction } = require('../utils/logger');

exports.getStudentProfile = async (req, res) => {
    try {
        // req.user.id comes from the student_users table (via Auth Middleware)
        const studentUserId = req.user.id;

        const query = `
            SELECT 
                s.id as student_user_id,
                a.surname, a.other_names, a.admission_status, 
                a.course_fee, a.instructor_remarks, a.id,
                c.title as course_name
            FROM student_users s
            JOIN applications a ON s.application_id = a.id
            JOIN courses c ON a.course_id = c.id
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
