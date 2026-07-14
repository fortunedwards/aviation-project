const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { logAction, fetchAuditLogs } = require('../utils/logger');

exports.getInstructorStudents = async (req, res) => {
    const instructorId = req.user.id; 

    try {
        // We select the array first, then use it in the WHERE clause
        const query = `
            SELECT 
                a.*, 
                INITCAP(a.admission_status) as admission_status,
                c.title AS course_name 
            FROM applications a
            JOIN courses c ON a.course_id = c.id
            WHERE a.course_id = ANY (
                SELECT unnest(assigned_course_id) 
                FROM staff_accounts 
                WHERE id = $1
            )
            ORDER BY a.submitted_at DESC
        `;
        
        const result = await db.query(query, [instructorId]);
        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (err) {
        // This will now help us see if it's still an operator issue
        console.error("❌ Instructor Queue Fetch Error:", err.message);
        res.status(500).json({ error: "Failed to fetch assigned applications" });
    }
};


exports.getAllApplications = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                a.*, 
                INITCAP(a.admission_status) as admission_status,
                COALESCE(c.title, 'No Course Assigned') as course_name 
            FROM applications a 
            LEFT JOIN courses c ON a.course_id = c.id 
            ORDER BY a.submitted_at DESC
        `);
        res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        console.error("❌ Manager Dashboard Error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.updateApplicationStatus = async (req, res) => {
    const { id } = req.params;
    const { status, remarks, course_fee } = req.body; 
    const staffId = req.user.id;
    const staffRole = req.user.role;

    try {
        // 1. Fetch current application to check existence and get data for account creation
        const appRes = await db.query('SELECT * FROM applications WHERE id = $1', [id]);
        if (appRes.rows.length === 0) {
            return res.status(404).json({ error: "Application not found" });
        }
        
        const application = appRes.rows[0];

        // 2. Fee Logic: Use the provided course_fee, or fallback to the course default if Approved
        let finalFee = course_fee || application.course_fee;

        if (status === 'Approved' && (!finalFee || parseFloat(finalFee) === 0)) {
            const feeColumnRes = await db.query(
                `
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_name = 'courses'
                      AND column_name IN ('fee_amount', 'course_fee')
                    ORDER BY CASE column_name WHEN 'fee_amount' THEN 0 ELSE 1 END
                    LIMIT 1
                `
            );

            if (feeColumnRes.rows.length > 0) {
                const feeColumn = feeColumnRes.rows[0].column_name;
                const courseData = await db.query(
                    `SELECT ${feeColumn}::numeric as course_fee FROM courses WHERE id = $1`,
                    [application.course_id]
                );
                finalFee = courseData.rows[0]?.course_fee || 0;
            } else {
                finalFee = 0;
            }
        }

        // 3. DATABASE UPDATE
        const updateQuery = `
            UPDATE applications 
            SET admission_status = $1, 
                instructor_remarks = $2, 
                course_fee = $3,
                reviewed_by = $4,
                reviewed_at = CURRENT_TIMESTAMP
            WHERE id = $5
            RETURNING *;
        `;
        const updatedAppResult = await db.query(updateQuery, [status, remarks, finalFee, staffId, id]);
        const updatedApp = updatedAppResult.rows[0];
        
        // 4. STUDENT ACCOUNT CREATION (Only for Approved & if doesn't exist)
        if (status === 'Approved') {
            const { email, surname, dob } = application;
            const checkUser = await db.query('SELECT id FROM student_users WHERE email = $1', [email]);
            
            if (checkUser.rows.length === 0) {
                // Generate password: surname + birth year (e.g., smith1995)
                const birthYear = new Date(dob).getFullYear();
                const rawPassword = `${surname.toLowerCase()}${birthYear}`;
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(rawPassword, salt);

                const createdStudentUser = await db.query(`
                    INSERT INTO student_users (email, password_hash, application_id)
                    VALUES ($1, $2, $3)
                    RETURNING id
                `, [email, hashedPassword, id]);

                await logAction({
                    req,
                    userId: staffId,
                    action: 'STUDENT_ACCOUNT_CREATED',
                    description: `Student portal account created for ${application.surname} ${application.other_names}.`,
                    actorRole: staffRole,
                    metadata: {
                        application_id: id,
                        student_user_id: createdStudentUser.rows[0].id,
                        email,
                    },
                    targetType: 'student_account',
                    targetId: createdStudentUser.rows[0].id,
                    statusCode: 201,
                });
            }
        }

        // 6. IMPROVED LOGGING
        await logAction({
            req,
            userId: staffId,
            action: 'APPLICATION_REVIEWED',
            description: `Staff (${staffRole}) changed status of ${application.surname}'s application to ${status}. Fee: ₦${finalFee}`,
            metadata: { 
                application_id: id, 
                new_status: status, 
                fee_assigned: finalFee,
                remarks: remarks
            },
            targetType: 'application',
            targetId: id
        });

        res.status(200).json({
            success: true,
            message: "Status updated and logged",
            data: updatedApp
        });

    } catch (err) {
        console.error("❌ Update Error:", err.message);
        res.status(500).json({ error: "Failed to update application status" });
    }
};

exports.getAuditLogs = async (req, res) => {
    try {
        const rows = await fetchAuditLogs();
        res.status(200).json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.trackApplication = async (req, res) => {
    const { identifier } = req.params;

    try {
        const query = `
            SELECT 
                a.surname, a.admission_status, a.payment_status, 
                INITCAP(a.admission_status) as admission_status,
                c.title as course_name, a.submitted_at as created_at
            FROM applications a
            JOIN courses c ON a.course_id = c.id
            WHERE a.email = $1 OR a.id::text = $1
            LIMIT 1;
        `;

        const result = await db.query(query, [identifier]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "No application found with that ID or Email." });
        }

        await logAction({
            req,
            action: 'APPLICATION_TRACKED',
            description: `Application tracking lookup performed for ${identifier}.`,
            actorType: 'system',
            metadata: { identifier },
            targetType: 'application_lookup',
            targetId: identifier,
        });

        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error("Tracking Error:", err.message);
        res.status(500).json({ error: "Server error during tracking." });
    }
};


exports.getCategorizedApplications = async (req, res) => {
    try {
        const query = `
            SELECT 
                c.id AS course_id, 
                c.title AS course_title,
                -- json_agg(a.*) can include nulls if a course has no applicants. 
                -- Use FILTER to keep the array empty instead of [null]
                COALESCE(
                    json_agg(a.*) FILTER (WHERE a.id IS NOT NULL), 
                    '[]'
                ) AS student_applications
            FROM courses c
            LEFT JOIN applications a ON c.id = a.course_id
            GROUP BY c.id, c.title
            ORDER BY c.title ASC;
        `;
        const result = await db.query(query);
        res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        console.error("❌ Categorized Fetch Error:", err.message);
        res.status(500).json({ error: err.message });
    }
};
