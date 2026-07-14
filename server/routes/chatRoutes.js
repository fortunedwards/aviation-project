const express = require('express');
const router = express.Router();
const db = require('../config/db');
const crypto = require('crypto');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { resolveAuthorizedRoom, isAdminRole, isStudentRole, isGuestRoomId } = require('../utils/chatAccess');
const { getActiveChatSession, startChatSessionIfNeeded } = require('../utils/chatSessions');

const ensureChatParticipant = (role) => {
  if (!isAdminRole(role) && !isStudentRole(role)) {
    const error = new Error('Forbidden');
    error.statusCode = 403;
    throw error;
  }
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
const isValidPhone = (value) => /^[0-9+\-\s()]{7,20}$/.test(String(value || '').trim());
let guestSchemaEnsured = false;

const ensureGuestChatSchema = async () => {
  if (guestSchemaEnsured) return;
  await db.query(`
    ALTER TABLE chat_guest_contacts
    ADD COLUMN IF NOT EXISTS guest_sender_id UUID
  `);
  guestSchemaEnsured = true;
};

const getGuestContact = async (roomId, token) => {
  await ensureGuestChatSchema();
  const result = await db.query(
    `SELECT room_id, guest_token, guest_sender_id
     FROM chat_guest_contacts
     WHERE room_id = $1
     LIMIT 1`,
    [roomId]
  );
  if (result.rows.length === 0 || result.rows[0].guest_token !== token) {
    const error = new Error('Invalid guest chat token');
    error.statusCode = 401;
    throw error;
  }
  const row = result.rows[0];
  if (!row.guest_sender_id) {
    const generatedSenderId = crypto.randomUUID();
    const updated = await db.query(
      `UPDATE chat_guest_contacts
       SET guest_sender_id = $1
       WHERE room_id = $2
       RETURNING room_id, guest_token, guest_sender_id`,
      [generatedSenderId, roomId]
    );
    return updated.rows[0];
  }
  return row;
};

const getActiveSessionWindow = async (roomId) => {
  const result = await db.query(
    `SELECT started_at
     FROM chat_sessions
     WHERE room_id = $1 AND active = TRUE
     ORDER BY started_at DESC
     LIMIT 1`,
    [roomId]
  );

  return result.rows[0] || null;
};

router.post('/upload', protect, (req, res) => {
  try {
    ensureChatParticipant(req.user.role);
  } catch (error) {
    return res.status(error.statusCode || 403).json({ message: error.message });
  }

  upload.chatFile.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    upload.uploadChatFileToCloudinary(req.file)
      .then((fileData) => res.json(fileData))
      .catch((uploadError) => {
        console.error(uploadError);
        res.status(500).json({ message: 'Server error uploading file' });
      });
  });
});

router.post('/upload-guest', (req, res) => {
  upload.chatFile.single('file')(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const { roomId, guestToken } = req.body || {};
    if (!roomId || !guestToken || !isGuestRoomId(roomId)) {
      return res.status(400).json({ message: 'Invalid guest chat credentials' });
    }

    try {
      await getGuestContact(String(roomId), String(guestToken));
      const fileData = await upload.uploadChatFileToCloudinary(req.file);
      res.json(fileData);
    } catch (error) {
      res.status(error.statusCode || 401).json({ message: error.message });
    }
  });
});

router.post('/guest/start', async (req, res) => {
  try {
    await ensureGuestChatSchema();

    const guestName = String(req.body?.name || '').trim();
    const guestEmail = String(req.body?.email || '').trim().toLowerCase();
    const guestPhone = String(req.body?.phone || '').trim();

    if (!guestName || !isValidEmail(guestEmail) || !isValidPhone(guestPhone)) {
      return res.status(400).json({ message: 'Valid name, email, and phone are required.' });
    }

    const existingGuest = await db.query(
      `SELECT room_id, guest_token, guest_sender_id
       FROM chat_guest_contacts
       WHERE LOWER(guest_email) = LOWER($1)
       ORDER BY created_at DESC
       LIMIT 1`,
      [guestEmail]
    );

    if (existingGuest.rows.length > 0) {
      const existing = existingGuest.rows[0];
      let guestSenderId = existing.guest_sender_id;
      if (!guestSenderId) {
        guestSenderId = crypto.randomUUID();
      }

      const refreshedToken = crypto.randomBytes(24).toString('hex');
      await db.query(
        `UPDATE chat_guest_contacts
         SET guest_name = $1,
             guest_phone = $2,
             guest_token = $3,
             guest_sender_id = $4
         WHERE room_id = $5`,
        [guestName, guestPhone, refreshedToken, guestSenderId, existing.room_id]
      );

      const linkedStudent = await db.query(
        `SELECT linked_student_user_id, linked_admission_status
         FROM chat_guest_contacts
         WHERE room_id = $1
         LIMIT 1`,
        [existing.room_id]
      );

      const linkedStudentUserId = linkedStudent.rows[0]?.linked_student_user_id || null;
      const linkedAdmissionStatus = linkedStudent.rows[0]?.linked_admission_status || null;

      return res.json({
        success: true,
        data: {
          roomId: existing.room_id,
          guestToken: refreshedToken,
          guestSenderId,
          resumed: true,
          guest: {
            name: guestName,
            email: guestEmail,
            phone: guestPhone,
            isRegisteredStudent: Boolean(linkedStudentUserId),
            isApprovedStudent: ['approved', 'enrolled'].includes(String(linkedAdmissionStatus || '').toLowerCase()),
          },
        },
      });
    }

    const roomId = `chat_guest_${crypto.randomUUID()}`;
    const guestToken = crypto.randomBytes(24).toString('hex');
    const guestSenderId = crypto.randomUUID();

    const linkedStudent = await db.query(
      `SELECT su.id AS student_user_id, a.admission_status
       FROM student_users su
       LEFT JOIN applications a ON su.application_id = a.id
       WHERE LOWER(su.email) = LOWER($1)
       LIMIT 1`,
      [guestEmail]
    );

    const linkedStudentUserId = linkedStudent.rows[0]?.student_user_id || null;
    const linkedAdmissionStatus = linkedStudent.rows[0]?.admission_status || null;

    await db.query(
      `INSERT INTO chat_guest_contacts (
        room_id, guest_token, guest_sender_id, guest_name, guest_email, guest_phone, linked_student_user_id, linked_admission_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [roomId, guestToken, guestSenderId, guestName, guestEmail, guestPhone, linkedStudentUserId, linkedAdmissionStatus]
    );

    res.json({
      success: true,
      data: {
        roomId,
        guestToken,
        guestSenderId,
        resumed: false,
        guest: {
          name: guestName,
          email: guestEmail,
          phone: guestPhone,
          isRegisteredStudent: Boolean(linkedStudentUserId),
          isApprovedStudent: ['approved', 'enrolled'].includes(String(linkedAdmissionStatus || '').toLowerCase()),
        },
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error starting guest chat' });
  }
});

router.get('/guest/history/:roomId', async (req, res) => {
  try {
    const roomId = String(req.params.roomId || '');
    const guestToken = String(req.headers['x-guest-token'] || '');
    if (!isGuestRoomId(roomId) || !guestToken) {
      return res.status(400).json({ message: 'Invalid guest chat credentials' });
    }
    const guestContact = await getGuestContact(roomId, guestToken);

    const history = await db.query(
      `SELECT id::text, sender_id::text as "senderId", message, status, file_url as "fileUrl", file_type as "fileType", created_at as "time"
       FROM messages
       WHERE room_id = $1
       ORDER BY created_at ASC`,
      [roomId]
    );

    res.json(history.rows);
  } catch (err) {
    console.error(err);
    res.status(err.statusCode || 500).json({ message: err.message || 'Server error fetching guest chat history' });
  }
});

router.get('/guest/session/:roomId', async (req, res) => {
  try {
    const roomId = String(req.params.roomId || '');
    const guestToken = String(req.headers['x-guest-token'] || '');
    if (!isGuestRoomId(roomId) || !guestToken) {
      return res.status(400).json({ message: 'Invalid guest chat credentials' });
    }
    const guestContact = await getGuestContact(roomId, guestToken);

    const session = await getActiveChatSession(roomId);
    res.json({
      success: true,
      data: {
        active: Boolean(session),
        roomId,
        session,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(err.statusCode || 500).json({ message: err.message || 'Server error fetching guest chat session' });
  }
});

router.post('/guest/send', async (req, res) => {
  try {
    const roomId = String(req.body?.roomId || '');
    const guestToken = String(req.body?.guestToken || '');
    const messageText = typeof req.body?.message === 'string' ? req.body.message : '';
    const fileUrl = req.body?.fileUrl || null;
    const fileType = req.body?.fileType || null;

    if (!isGuestRoomId(roomId) || !guestToken) {
      return res.status(400).json({ message: 'Invalid guest chat credentials' });
    }
    const guestContact = await getGuestContact(roomId, guestToken);

    if (!messageText.trim() && !fileUrl) {
      return res.status(400).json({ message: 'Message or file is required.' });
    }

    try {
      await startChatSessionIfNeeded({
        roomId,
        studentId: null,
        startedBy: roomId,
        startedByRole: 'guest',
      });
    } catch (sessionError) {
      console.warn(`Guest chat session start skipped for room ${roomId}:`, sessionError.message);
    }

    const result = await db.query(
      `INSERT INTO messages (sender_id, receiver_id, room_id, message, status, file_url, file_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, created_at`,
      [guestContact.guest_sender_id, null, roomId, messageText || null, 'sent', fileUrl, fileType]
    );

    const payload = {
      id: result.rows[0].id.toString(),
      senderId: String(guestContact.guest_sender_id),
      message: messageText || null,
      fileUrl,
      fileType,
      room: roomId,
      time: result.rows[0].created_at,
      status: 'sent',
    };

    const io = req.app.get('io');
    if (io) {
      io.to(roomId).emit('receive_message', payload);
      io.emit('new_unread', { roomId, senderId: roomId });
    }

    res.json({ success: true, data: payload });
  } catch (err) {
    console.error(err);
    res.status(err.statusCode || 500).json({ message: err.message || 'Server error sending guest chat message' });
  }
});

router.get('/history/:roomId', protect, async (req, res) => {
  try {
    const { roomId } = await resolveAuthorizedRoom({
      role: req.user.role,
      userId: String(req.user.id),
      roomId: req.params.roomId,
    });

    const activeSession = await getActiveSessionWindow(roomId);
    if (!activeSession) {
      return res.json([]);
    }

    const history = await db.query(
      `SELECT id::text, sender_id::text as "senderId", message, status, file_url as "fileUrl", file_type as "fileType", created_at as "time"
       FROM messages
       WHERE room_id = $1
         AND created_at >= $2
       ORDER BY created_at ASC`,
      [roomId, activeSession.started_at]
    );

    res.json(history.rows);
  } catch (err) {
    console.error(err);
    res.status(err.statusCode || 500).json({ message: err.message || 'Server error fetching chat history' });
  }
});

router.get('/unread', protect, async (req, res) => {
  try {
    ensureChatParticipant(req.user.role);

    const userId = String(req.user.id);
    const role = req.user.role;
    const isStudent = isStudentRole(role);

    const result = await db.query(
      `
        SELECT
          m.room_id as "roomId",
          COUNT(*)::int as count
        FROM messages m
        LEFT JOIN chat_room_reads r
          ON r.room_id = m.room_id
         AND r.user_id = $1
        WHERE m.sender_id::text != $1
          AND (
            r.last_read_at IS NULL
            OR m.created_at > r.last_read_at
          )
          AND (
            ($2::boolean = true AND m.room_id = $3)
            OR ($2::boolean = false)
          )
        GROUP BY m.room_id
      `,
      [userId, isStudent, `chat_${userId}`]
    );

    const counts = {};
    result.rows.forEach((row) => {
      counts[row.roomId] = parseInt(row.count, 10);
    });

    res.json(counts);
  } catch (err) {
    console.error(err);
    res.status(err.statusCode || 500).json({ message: err.message || 'Server error fetching unread counts' });
  }
});

router.post('/read/:roomId', protect, async (req, res) => {
  try {
    const { roomId } = await resolveAuthorizedRoom({
      role: req.user.role,
      userId: String(req.user.id),
      roomId: req.params.roomId,
    });

    await db.query(
      `
        INSERT INTO chat_room_reads (room_id, user_id, last_read_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (room_id, user_id)
        DO UPDATE SET last_read_at = EXCLUDED.last_read_at
      `,
      [roomId, String(req.user.id)]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(err.statusCode || 500).json({ message: err.message || 'Server error marking messages as read' });
  }
});

router.get('/session/:roomId', protect, async (req, res) => {
  try {
    const { roomId } = await resolveAuthorizedRoom({
      role: req.user.role,
      userId: String(req.user.id),
      roomId: req.params.roomId,
    });

    const session = await getActiveChatSession(roomId);
    res.json({
      success: true,
      data: {
        active: Boolean(session),
        roomId,
        session,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(err.statusCode || 500).json({ message: err.message || 'Server error fetching chat session' });
  }
});

router.get('/conversations', protect, async (req, res) => {
  try {
    if (!isAdminRole(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const adminUserId = String(req.user.id);
    const result = await db.query(
      `
        WITH student_conversations AS (
          SELECT
            'student'::text AS conversation_type,
            su.id::text AS student_user_id,
            a.id::text AS application_id,
            CONCAT('chat_', su.id::text) AS room_id,
            a.surname,
            a.other_names,
            a.email,
            NULL::text AS phone,
            a.admission_status,
            a.payment_status,
            c.title AS course_name,
            TRUE AS is_registered_student,
            (LOWER(COALESCE(a.admission_status, '')) IN ('approved', 'enrolled')) AS is_approved_student
          FROM student_users su
          JOIN applications a ON su.application_id = a.id
          LEFT JOIN courses c ON a.course_id = c.id
        ),
        guest_conversations AS (
          SELECT
            'guest'::text AS conversation_type,
            gc.linked_student_user_id::text AS student_user_id,
            a.id::text AS application_id,
            gc.room_id,
            SPLIT_PART(gc.guest_name, ' ', 1) AS surname,
            NULLIF(BTRIM(REPLACE(gc.guest_name, SPLIT_PART(gc.guest_name, ' ', 1), '')), '') AS other_names,
            gc.guest_email AS email,
            gc.guest_phone AS phone,
            gc.linked_admission_status AS admission_status,
            NULL::text AS payment_status,
            c.title AS course_name,
            (gc.linked_student_user_id IS NOT NULL) AS is_registered_student,
            (LOWER(COALESCE(gc.linked_admission_status, '')) IN ('approved', 'enrolled')) AS is_approved_student
          FROM chat_guest_contacts gc
          LEFT JOIN student_users su ON su.id = gc.linked_student_user_id
          LEFT JOIN applications a ON su.application_id = a.id
          LEFT JOIN courses c ON a.course_id = c.id
        ),
        conversation_base AS (
          SELECT * FROM student_conversations
          UNION ALL
          SELECT * FROM guest_conversations
        )
        SELECT
          cb.conversation_type,
          cb.student_user_id,
          cb.application_id,
          cb.room_id,
          cb.surname,
          cb.other_names,
          cb.email,
          cb.phone,
          cb.admission_status,
          cb.payment_status,
          cb.course_name,
          cb.is_registered_student,
          cb.is_approved_student,
          lm.id::text AS last_message_id,
          lm.message AS last_message,
          lm.file_url AS last_file_url,
          lm.file_type AS last_file_type,
          lm.sender_id::text AS last_sender_id,
          lm.created_at AS last_message_at,
          COALESCE(unread.unread_count, 0)::int AS unread_count,
          COALESCE(cs.active, FALSE) AS session_active,
          cs.started_at AS session_started_at,
          cs.started_by_role AS session_started_by_role
        FROM conversation_base cb
        LEFT JOIN LATERAL (
          SELECT m.*
          FROM messages m
          WHERE m.room_id = cb.room_id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) lm ON TRUE
        LEFT JOIN LATERAL (
          SELECT COUNT(*) AS unread_count
          FROM messages m
          LEFT JOIN chat_room_reads r
            ON r.room_id = cb.room_id
           AND r.user_id = $1
          WHERE m.room_id = cb.room_id
            AND m.sender_id::text != $1
            AND (r.last_read_at IS NULL OR m.created_at > r.last_read_at)
        ) unread ON TRUE
        LEFT JOIN LATERAL (
          SELECT active, started_at, started_by_role
          FROM chat_sessions
          WHERE room_id = cb.room_id
          ORDER BY started_at DESC
          LIMIT 1
        ) cs ON TRUE
        ORDER BY
          COALESCE(lm.created_at, cs.started_at, CURRENT_TIMESTAMP - INTERVAL '100 years') DESC
      `,
      [adminUserId]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching conversations' });
  }
});

module.exports = router;
