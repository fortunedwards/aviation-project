const normalizeRole = (role) => String(role || '').toLowerCase();

const isStudentRole = (role) => normalizeRole(role) === 'student';
const isAdminRole = (role) => normalizeRole(role) === 'admin';

const getStudentRoomId = (studentUserId) => `chat_${studentUserId}`;
const isGuestRoomId = (roomId) => String(roomId || '').startsWith('chat_guest_');

const parseStudentIdFromRoomId = (roomId) => {
    if (!roomId || !String(roomId).startsWith('chat_')) return null;
    if (isGuestRoomId(roomId)) return null;
    return String(roomId).slice(5) || null;
};

const assertChatRoleAllowed = (role) => {
    if (!isStudentRole(role) && !isAdminRole(role)) {
        const error = new Error('Forbidden');
        error.statusCode = 403;
        throw error;
    }
};

const resolveAuthorizedRoom = async ({ role, userId, studentId = null, roomId = null }) => {
    assertChatRoleAllowed(role);

    if (isStudentRole(role)) {
        const ownRoomId = getStudentRoomId(userId);

        if (studentId && String(studentId) !== String(userId)) {
            const error = new Error('Students can only access their own chat room');
            error.statusCode = 403;
            throw error;
        }

        if (roomId && roomId !== ownRoomId) {
            const error = new Error('Students can only access their own chat room');
            error.statusCode = 403;
            throw error;
        }

        return { roomId: ownRoomId, studentId: String(userId) };
    }

    if (roomId && isGuestRoomId(roomId)) {
        return {
            roomId: String(roomId),
            studentId: null,
        };
    }

    if (roomId) {
        const resolvedFromRoom = parseStudentIdFromRoomId(roomId);
        if (resolvedFromRoom) {
            return {
                roomId: String(roomId),
                studentId: String(resolvedFromRoom),
            };
        }
    }

    const resolvedStudentId = studentId || parseStudentIdFromRoomId(roomId);
    if (!resolvedStudentId) {
        const error = new Error('Student identifier is required');
        error.statusCode = 400;
        throw error;
    }

    return {
        roomId: getStudentRoomId(String(resolvedStudentId)),
        studentId: String(resolvedStudentId),
    };
};

module.exports = {
    isAdminRole,
    isStudentRole,
    normalizeRole,
    getStudentRoomId,
    parseStudentIdFromRoomId,
    isGuestRoomId,
    resolveAuthorizedRoom,
};
