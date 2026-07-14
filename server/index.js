const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './.env' });

const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const staffRoutes = require('./routes/staffRoutes');
const studentRoutes = require('./routes/studentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const chatRoutes = require('./routes/chatRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const { attachAuditHelpers, logAction } = require('./utils/logger');
const { startChatSessionIfNeeded, endActiveChatSession, deleteChatSessionData } = require('./utils/chatSessions');
const { resolveAuthorizedRoom, isAdminRole, isStudentRole } = require('./utils/chatAccess');

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
app.set('trust proxy', 1);

const allowedOrigins = (process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(attachAuditHelpers);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'img-src': ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'],
    }
  },
  crossOriginResourcePolicy: false,
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many login attempts, please try again later.'
});
app.use('/api/auth', authLimiter);

app.use('/uploads', (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.query.token;
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const allowed = ['Admin', 'Manager', 'Instructor'];
    if (!allowed.includes(decoded.role)) return res.status(403).json({ message: 'Forbidden' });
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}, express.static(path.join(__dirname, 'uploads')));

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});
app.set('io', io);

io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error('Authentication error: Invalid token'));
    socket.user = decoded;
    next();
  });
});

io.on('connection', (socket) => {
  const userId = String(socket.user.id);
  console.log('User Authorized & Connected:', userId);

  socket.on('join_room', async (payload, callback = () => {}) => {
    try {
      const requestedStudentId = typeof payload === 'object'
        ? payload?.studentId
        : (!String(payload || '').startsWith('chat_') ? payload : null);
      const requestedRoomId = typeof payload === 'object'
        ? payload?.roomId
        : (String(payload || '').startsWith('chat_') ? payload : null);
      const { roomId } = await resolveAuthorizedRoom({
        role: socket.user.role,
        userId,
        studentId: requestedStudentId ? String(requestedStudentId) : null,
        roomId: requestedRoomId ? String(requestedRoomId) : null,
      });

      socket.join(roomId);

      const deliveryResult = await db.query(
        `UPDATE messages
         SET status = 'delivered'
         WHERE room_id = $1 AND sender_id::text != $2 AND status = 'sent'
         RETURNING id`,
        [roomId, userId]
      );

      if (deliveryResult.rows.length > 0) {
        const ids = deliveryResult.rows.map((row) => row.id.toString());
        io.to(roomId).emit('messages_delivered', { roomId, messageIds: ids });
      }

      callback({ success: true, roomId });
    } catch (err) {
      callback({ success: false, message: err.message || 'Unable to join room' });
    }
  });

  socket.on('send_message', async (data, callback = () => {}) => {
    try {
      const requestedStudentId = data?.studentId ? String(data.studentId) : null;
      const requestedRoomId = data?.roomId ? String(data.roomId) : (data?.room ? String(data.room) : null);
      const { roomId, studentId } = await resolveAuthorizedRoom({
        role: socket.user.role,
        userId,
        studentId: requestedStudentId,
        roomId: requestedRoomId,
      });

      const senderIsStudent = isStudentRole(socket.user.role);
      const senderIsAdmin = isAdminRole(socket.user.role);
      const senderId = userId;
      const receiverId = senderIsStudent ? null : (studentId || null);
      const messageText = typeof data?.message === 'string' ? data.message : '';
      const fileUrl = data?.fileUrl || null;
      const fileType = data?.fileType || null;

      if (!messageText.trim() && !fileUrl) {
        callback({ success: false, message: 'Message or file is required.' });
        return;
      }

      let started = false;
      try {
        const sessionResult = await startChatSessionIfNeeded({
          roomId,
          studentId,
          startedBy: senderId,
          startedByRole: socket.user.role,
        });
        started = Boolean(sessionResult?.started);
      } catch (sessionError) {
        console.warn(`Chat session start skipped for room ${roomId}:`, sessionError.message);
      }

      if (started) {
        await logAction({
          userId: senderId,
          actorRole: socket.user.role,
          action: 'CHAT_SESSION_STARTED',
          description: `Chat session started in room ${roomId}.`,
          metadata: {
            room_id: roomId,
            student_id: studentId,
            started_by_role: socket.user.role,
            socket_event: 'send_message',
          },
          targetType: 'chat_room',
          targetId: roomId,
        });

        io.to(roomId).emit('chat_session_started', { roomId, startedByRole: socket.user.role });
      }

      socket.join(roomId);

      const roomSockets = await io.in(roomId).fetchSockets();
      const receiverInRoom = roomSockets.some((joinedSocket) => String(joinedSocket.user.id) !== senderId);
      const status = receiverInRoom ? 'delivered' : 'sent';

      const result = await db.query(
        `INSERT INTO messages (sender_id, receiver_id, room_id, message, status, file_url, file_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, created_at`,
        [senderId, receiverId, roomId, messageText || null, status, fileUrl, fileType]
      );

      const messageId = result.rows[0].id.toString();
      const createdAt = result.rows[0].created_at;

      io.to(roomId).emit('receive_message', {
        id: messageId,
        senderId,
        message: messageText || null,
        fileUrl,
        fileType,
        room: roomId,
        time: createdAt,
        status,
      });

      if (receiverInRoom) {
        socket.emit('messages_delivered', { roomId, messageIds: [messageId] });
      }

      if (!senderIsAdmin) {
        io.sockets.sockets.forEach((connectedSocket) => {
          if (String(connectedSocket.user.id) !== senderId && !connectedSocket.rooms.has(roomId)) {
            connectedSocket.emit('new_unread', { roomId, senderId });
          }
        });
      }

      callback({ success: true, roomId, messageId });
    } catch (err) {
      console.error('Socket DB Error:', err.message);
      callback({ success: false, message: err.message || 'Unable to send message.' });
    }
  });

  socket.on('end_chat_session', async ({ studentId, roomId: requestedRoomId }, callback = () => {}) => {
    try {
      if (!isAdminRole(socket.user.role)) {
        callback({ success: false, message: 'Only admin can end chat sessions.' });
        return;
      }

      const { roomId, studentId: resolvedStudentId } = await resolveAuthorizedRoom({
        role: socket.user.role,
        userId,
        studentId: studentId ? String(studentId) : null,
        roomId: requestedRoomId ? String(requestedRoomId) : null,
      });

      const endedSession = await endActiveChatSession({
        roomId,
        endedBy: userId,
        endedByRole: socket.user.role,
      });

      if (!endedSession) {
        callback({ success: false, message: 'No active chat session found.' });
        return;
      }

      await logAction({
        userId,
        actorRole: socket.user.role,
        action: 'CHAT_SESSION_ENDED',
        description: `Admin ended chat session in room ${roomId}.`,
        metadata: {
          room_id: roomId,
          student_id: resolvedStudentId || null,
          socket_event: 'end_chat_session',
        },
        targetType: 'chat_room',
        targetId: roomId,
      });

      io.to(roomId).emit('chat_session_ended', { roomId, endedByRole: socket.user.role });
      callback({ success: true, roomId });
    } catch (err) {
      console.error('Chat session end error:', err.message);
      callback({ success: false, message: err.message || 'Failed to end chat session.' });
    }
  });

  socket.on('delete_chat_session', async ({ studentId, roomId: requestedRoomId }, callback = () => {}) => {
    try {
      if (!isAdminRole(socket.user.role)) {
        callback({ success: false, message: 'Only admin can delete chat sessions.' });
        return;
      }

      const { roomId, studentId: resolvedStudentId } = await resolveAuthorizedRoom({
        role: socket.user.role,
        userId,
        studentId: studentId ? String(studentId) : null,
        roomId: requestedRoomId ? String(requestedRoomId) : null,
      });

      await deleteChatSessionData({ roomId });

      await logAction({
        userId,
        actorRole: socket.user.role,
        action: 'CHAT_SESSION_DELETED',
        description: `Admin deleted chat session data for room ${roomId}.`,
        metadata: {
          room_id: roomId,
          student_id: resolvedStudentId || null,
          socket_event: 'delete_chat_session',
        },
        targetType: 'chat_room',
        targetId: roomId,
      });

      io.to(roomId).emit('chat_session_deleted', { roomId, deletedByRole: socket.user.role });
      callback({ success: true, roomId });
    } catch (err) {
      console.error('Chat session delete error:', err.message);
      callback({ success: false, message: err.message || 'Failed to delete chat session.' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User Disconnected:', socket.id);
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/calendar', calendarRoutes);

app.get('/', (req, res) => {
  res.send('Aeroconsult is Live with WebSockets...');
});

server.listen(PORT, () => {
  console.log(`Aeroconsult Server soaring on port ${PORT}`);
});

