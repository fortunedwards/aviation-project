const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); 
const upload = require('../middleware/uploadMiddleware');
const { logAction } = require('../utils/logger');

exports.registerStudent = async (req, res) => {
    try {
        const { 
            surname, 
            other_names, 
            email, 
            dob, 
            sex,
            place_of_birth,
            state_of_origin,
            nationality,
            address,
            phone, 
            selectedCourse, 
            nok_name, 
            nok_phone, 
            nok_relation,
            org_pos,
            education, 
            technical, 
            qualifications, 
            experience, 
            payment_ref 
        } = req.body;

        // 1. Check for duplicate email
        const existing = await db.query('SELECT id FROM applications WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ success: false, error: "An application with this email already exists." });
        }

        // 2. Validation passed — now upload files to Cloudinary
        const savedFiles = await upload.uploadApplicationFiles(req.files);
        const passportPath = savedFiles['passport'] || null;
        const certificatePath = savedFiles['certificates'] || null;

        // 3. Prepare the SQL Query
        const query = `
            INSERT INTO applications (
                surname, other_names, email, dob, sex,
                place_of_birth, state_of_origin, nationality, address,
                phone, course_id, nok_name, nok_phone, nok_relation,
                org_pos, education, technical, qualifications, experience,
                payment_status, passport_url, certificate_url, payment_ref
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
            RETURNING id;
        `;

        const values = [
            surname, other_names, email, dob, sex,
            place_of_birth, state_of_origin, nationality, address,
            phone, selectedCourse, nok_name, nok_phone, nok_relation,
            org_pos || null, education || null, technical || null, qualifications || null, experience || null,
            payment_ref && payment_ref !== 'FREE_REG' ? 'Paid' : 'Pending',
            passportPath, certificatePath, payment_ref
        ];

        // 4. Execute the query
        const result = await db.query(query, values);
        
        console.log(`✅ New application received: ID ${result.rows[0].id}`);

        await logAction({
            req,
            action: 'STUDENT_APPLICATION_SUBMITTED',
            description: `New student application submitted by ${surname} ${other_names}.`,
            actorType: 'student',
            actorName: `${surname} ${other_names}`.trim(),
            metadata: {
                application_id: result.rows[0].id,
                email,
                course_id: selectedCourse,
                payment_ref,
            },
            targetType: 'application',
            targetId: result.rows[0].id,
            statusCode: 201,
        });

        res.status(201).json({ 
            success: true, 
            message: "Enrollment application submitted successfully!", 
            applicationId: result.rows[0].id 
        });

    } catch (err) {
        console.error("❌ Enrollment Error:", err.message);
        
        // Handle specific DB errors (like missing columns)
        if (err.code === '42703') {
            return res.status(500).json({ 
                error: "Database Schema Mismatch. Did you add passport_url and certificate_url columns?" 
            });
        }

        res.status(500).json({ error: "Server error during enrollment process" });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Try to find the user in the STAFF table first
        let userRes = await db.query('SELECT * FROM staff_accounts WHERE email = $1', [email]);
        let user = userRes.rows[0];
        let tableSource = 'staff';

        // 2. If not found in staff, check the STUDENT table
        if (!user) {
            userRes = await db.query('SELECT * FROM student_users WHERE email = $1', [email]);
            user = userRes.rows[0];
            tableSource = 'student';
        }

        // 3. Handle User Not Found
        if (!user) {
            await logAction({
                req,
                action: 'LOGIN_FAILED',
                description: `Failed login attempt for ${email}.`,
                actorType: 'system',
                metadata: { email, reason: 'user_not_found' },
                success: false,
                statusCode: 401,
            });
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // 4. Verify Password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            await logAction({
                req,
                action: 'LOGIN_FAILED',
                description: `Failed login attempt for ${email}.`,
                userId: user.id,
                actorRole: tableSource === 'staff' ? user.role : 'Student',
                actorType: tableSource === 'staff' ? 'staff' : 'student',
                actorName: user.full_name || user.name || email,
                metadata: { email, reason: 'invalid_password' },
                success: false,
                statusCode: 401,
            });
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // 5. Generate Token
        // If they came from staff table, use their DB role (Manager/Instructor)
        // If they came from student table, force the role to 'Student'
        const role = tableSource === 'staff' ? user.role : 'Student';
        
        const token = jwt.sign(
            { id: user.id, role: role },
            process.env.JWT_SECRET,
            { expiresIn: '4h' }
        );

        // 6. Return Success Response
        await logAction({
            req,
            userId: user.id,
            action: 'LOGIN_SUCCESS',
            description: `${tableSource === 'staff' ? 'Staff' : 'Student'} user logged in successfully.`,
            actorRole: role,
            actorType: tableSource === 'staff' ? 'staff' : 'student',
            actorName: user.full_name || user.name || email,
            metadata: {
                email,
                source_table: tableSource,
            },
            statusCode: 200,
        });

        res.status(200).json({
            success: true,
            token,
            user: { 
                id: user.id, 
                // Uses 'name' for staff, defaults to 'Student' for student_users
                name: user.full_name || user.name || 'Student',
                email: user.email, 
                role: role 
            }
        });

    } catch (err) {
        console.error("❌ Unified Login Error:", err.message);
        res.status(500).json({ error: "Server error during login process" });
    }
};

exports.logout = async (req, res) => {
    try {
        await logAction({
            req,
            userId: req.user.id,
            action: 'LOGOUT',
            description: 'User logged out successfully.',
            actorRole: req.user.role,
            actorType: String(req.user.role).toLowerCase() === 'student' ? 'student' : 'staff',
            statusCode: 200,
        });

        res.status(200).json({ success: true, message: 'Logged out successfully.' });
    } catch (err) {
        console.error('Logout Error:', err.message);
        res.status(500).json({ error: 'Server error during logout process' });
    }
};
