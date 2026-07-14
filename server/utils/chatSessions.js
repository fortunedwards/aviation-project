const db = require('../config/db');

const withRoomLock = async (client, roomId) => {
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [roomId]);
};

const getActiveChatSession = async (roomId, client = db) => {
    const result = await client.query(
        `
            SELECT *
            FROM chat_sessions
            WHERE room_id = $1 AND active = TRUE
            ORDER BY started_at DESC
            LIMIT 1
        `,
        [roomId]
    );

    return result.rows[0] || null;
};

const startChatSessionIfNeeded = async ({ roomId, studentId, startedBy, startedByRole }) => {
    const client = await db.connect();

    try {
        await client.query('BEGIN');
        await withRoomLock(client, roomId);

        const activeSession = await getActiveChatSession(roomId, client);
        if (activeSession) {
            await client.query('COMMIT');
            return { started: false, session: activeSession };
        }

        const result = await client.query(
            `
                INSERT INTO chat_sessions (room_id, student_id, active, started_by, started_by_role)
                VALUES ($1, $2, TRUE, $3, $4)
                RETURNING *
            `,
            [roomId, studentId, startedBy, startedByRole]
        );

        await client.query('COMMIT');
        return { started: true, session: result.rows[0] };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const endActiveChatSession = async ({ roomId, endedBy, endedByRole }) => {
    const client = await db.connect();

    try {
        await client.query('BEGIN');
        await withRoomLock(client, roomId);

        const result = await client.query(
            `
                WITH ended AS (
                    UPDATE chat_sessions
                    SET active = FALSE,
                        ended_by = $2,
                        ended_by_role = $3,
                        ended_at = CURRENT_TIMESTAMP
                    WHERE room_id = $1
                      AND active = TRUE
                    RETURNING *
                )
                SELECT *
                FROM ended
                ORDER BY started_at DESC
                LIMIT 1
            `,
            [roomId, endedBy, endedByRole]
        );

        await client.query('COMMIT');
        return result.rows[0] || null;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const deleteChatSessionData = async ({ roomId }) => {
    const client = await db.connect();

    try {
        await client.query('BEGIN');
        await withRoomLock(client, roomId);

        await client.query('DELETE FROM chat_room_reads WHERE room_id = $1', [roomId]);
        await client.query('DELETE FROM messages WHERE room_id = $1', [roomId]);
        await client.query('DELETE FROM chat_sessions WHERE room_id = $1', [roomId]);

        // Guest rooms carry extra metadata in this table.
        if (String(roomId).startsWith('chat_guest_')) {
            await client.query('DELETE FROM chat_guest_contacts WHERE room_id = $1', [roomId]);
        }

        await client.query('COMMIT');
        return { success: true };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    getActiveChatSession,
    startChatSessionIfNeeded,
    endActiveChatSession,
    deleteChatSessionData,
};
