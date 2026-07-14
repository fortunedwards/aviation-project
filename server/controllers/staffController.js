const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { logAction, fetchAuditLogs } = require('../utils/logger');

const hasStaffStatusColumn = async () => {
    const result = await db.query(
        `
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'staff_accounts'
                  AND column_name = 'status'
            ) AS exists
        `
    );

    return Boolean(result.rows[0]?.exists);
};

exports.getAllStaff = async (req, res) => {
    try {
        const statusColumnExists = await hasStaffStatusColumn();
        const query = statusColumnExists
            ? `
                SELECT 
                    id, 
                    full_name, 
                    email, 
                    role, 
                    COALESCE(status, 'Active') as status,
                    COALESCE(assigned_course_id, '{}') as assigned_course_id,
                    created_at 
                FROM staff_accounts 
                ORDER BY created_at DESC
            `
            : `
                SELECT 
                    id, 
                    full_name, 
                    email, 
                    role, 
                    'Active' as status,
                    COALESCE(assigned_course_id, '{}') as assigned_course_id,
                    created_at 
                FROM staff_accounts 
                ORDER BY created_at DESC
            `;

        const result = await db.query(query);
        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (err) {
        console.error("❌ Fetch Staff Error:", err.message);
        res.status(500).json({ 
            success: false,
            error: "Could not retrieve staff list" 
        });
    }
};

exports.createStaffAccount = async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        // 1. Check if user already exists
        const userExists = await db.query('SELECT * FROM staff_accounts WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ success: false, error: "A staff member with this email already exists" });
        }

        // 2. Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Insert into database
        const newUser = await db.query(
            `INSERT INTO staff_accounts (full_name, email, password_hash, role) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, full_name, email, role`,
            [name, email, hashedPassword, role]
        );

        await logAction({
            req,
            userId: req.user.id,
            action: 'STAFF_CREATED',
            description: `Created staff account for ${name}.`,
            actorRole: req.user.role,
            metadata: {
                created_staff_id: newUser.rows[0].id,
                created_staff_role: role,
                email,
            },
            targetType: 'staff_account',
            targetId: newUser.rows[0].id,
            statusCode: 201,
        });

        res.status(201).json({
            success: true,
            message: "Staff account created successfully",
            data: newUser.rows[0]
        });
    } catch (err) {
        console.error("❌ Create Staff Error:", err.message);
        res.status(500).json({ success: false, error: "Server error during account creation" });
    }
};


exports.getAuditLogs = async (req, res) => {
    try {
        const result = { rows: await fetchAuditLogs() };
        
        res.status(200).json({ 
            success: true, 
            data: result.rows 
        });
    } catch (err) {
        console.error("❌ Audit Log SQL Error:", err.message); 
        res.status(500).json({ success: false, error: "Database error: " + err.message });
    }
};

exports.deleteStaff = async (req, res) => {
    const { id } = req.params;
    try {
        const client = await db.connect();
        let deletedName = "Unknown Staff";
        try {
            await client.query('BEGIN');

            // 1. Get staff name before deleting for a better log description
            const staffMember = await client.query('SELECT full_name FROM staff_accounts WHERE id = $1', [id]);
            deletedName = staffMember.rows[0]?.full_name || "Unknown Staff";

            // 2. Break FK references from audit logs to this staff account.
            // Different environments may use either user_id or staff_id.
            const auditColumns = await client.query(
                `
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_name = 'audit_logs'
                      AND column_name IN ('user_id', 'staff_id')
                `
            );

            for (const row of auditColumns.rows) {
                await client.query(
                    `UPDATE audit_logs SET ${row.column_name} = NULL WHERE ${row.column_name} = $1`,
                    [id]
                );
            }

            // 3. Perform deletion
            await client.query('DELETE FROM staff_accounts WHERE id = $1', [id]);
            await client.query('COMMIT');
        } catch (txError) {
            await client.query('ROLLBACK');
            throw txError;
        } finally {
            client.release();
        }

        // 4. Log the action
        await logAction({
            req,
            userId: req.user.id, // The Manager/Admin performing the delete
            action: 'STAFF_DELETED',
            description: `Deleted staff account: ${deletedName} (ID: ${id})`,
            metadata: { deleted_staff_id: id },
            targetType: 'staff_account',
            targetId: id
        });

        res.status(200).json({ success: true, message: "Staff deleted successfully" });
    } catch (err) {
        console.error("❌ Delete Staff Error:", err.message);
        res.status(500).json({ success: false, error: "Database error during deletion" });
    }
};

exports.assignCourse = async (req, res) => {
    const { staffId, courseIds } = req.body; // courseIds should be ['uuid1', 'uuid2']

    try {
        const finalArray = Array.isArray(courseIds) ? courseIds : [];

            await db.query(
            'UPDATE staff_accounts SET assigned_course_id = $1 WHERE id = $2',
            [finalArray, staffId]
        );

        await logAction({
            req,
            userId: req.user.id, // The manager doing the assigning
            action: 'COURSE_ASSIGNMENT_UPDATED',
            description: `Updated course assignments for staff ID: ${staffId}`,
            metadata: { staff_id: staffId, course_ids: finalArray },
            targetType: 'staff_account',
            targetId: staffId
        });

        res.status(200).json({ success: true, message: "Assignments updated" });
    } catch (err) {
        console.error("❌ Assign Course Error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.updateStaffStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const allowedStatuses = ['Active', 'Inactive'];

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid staff status' });
    }

    try {
        const statusColumnExists = await hasStaffStatusColumn();

        if (!statusColumnExists) {
            return res.status(400).json({
                success: false,
                error: 'Staff status is not available yet. Run the staff status migration first.',
            });
        }

        const updated = await db.query(
            `UPDATE staff_accounts
             SET status = $1
             WHERE id = $2
             RETURNING id, full_name, email, role, COALESCE(status, 'Active') as status`,
            [status, id]
        );

        if (updated.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Staff member not found' });
        }

        await logAction({
            req,
            userId: req.user.id,
            action: 'STAFF_STATUS_UPDATED',
            description: `Updated staff status for ${updated.rows[0].full_name} to ${status}.`,
            actorRole: req.user.role,
            metadata: {
                staff_id: id,
                new_status: status,
            },
            targetType: 'staff_account',
            targetId: id,
            statusCode: 200,
        });

        res.status(200).json({
            success: true,
            message: 'Staff status updated successfully',
            data: updated.rows[0],
        });
    } catch (err) {
        console.error('❌ Update Staff Status Error:', err.message);
        res.status(500).json({ success: false, error: 'Database error during status update' });
    }
};
