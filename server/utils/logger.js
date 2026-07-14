const db = require('../config/db');

const EXPLICIT_AUDIT_COLUMNS = [
    'actor_role',
    'actor_type',
    'actor_name',
    'target_type',
    'target_id',
    'route',
    'request_method',
    'ip_address',
    'user_agent',
    'success',
    'status_code',
    'entity_before',
    'entity_after',
];

const EXCLUDED_AUDIT_ACTIONS = new Set([
    'INSTRUCTOR_QUEUE_VIEWED',
    'APPLICATIONS_VIEWED',
    'APPLICATIONS_CATEGORIZED_VIEWED',
    'STAFF_LIST_VIEWED',
    'STUDENT_PROFILE_VIEWED',
    'CHAT_HISTORY_VIEWED',
    'CHAT_UNREAD_VIEWED',
    'CHAT_MARKED_READ',
    'CHAT_MESSAGES_DELIVERED',
    'CHAT_MESSAGE_SENT',
    'CHAT_FILE_UPLOADED',
    'AUDIT_LOGS_VIEWED',
]);

let auditLogColumnState = null;

const getActorTypeFromRole = (role) => {
    if (!role) return 'system';
    return String(role).toLowerCase() === 'student' ? 'student' : 'staff';
};

const sanitizeMetadata = (metadata = {}) => {
    try {
        return JSON.parse(JSON.stringify(metadata));
    } catch (err) {
        return { serialization_error: err.message };
    }
};

const buildRequestContext = (req) => {
    if (!req) return {};

    return {
        route: req.originalUrl || req.url || null,
        method: req.method || null,
        ip_address: req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
        user_agent: req.headers['user-agent'] || null,
    };
};

const getSerializableSnapshot = (value) => {
    if (value === undefined) return null;
    return sanitizeMetadata(value);
};

const loadAuditLogColumnState = async () => {
    if (auditLogColumnState) return auditLogColumnState;

    const result = await db.query(
        `
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'audit_logs'
        `
    );

    const availableColumns = new Set(result.rows.map((row) => row.column_name));

    auditLogColumnState = {
        availableColumns,
        hasMetadataColumn: availableColumns.has('metadata'),
        supportsExplicitColumns: EXPLICIT_AUDIT_COLUMNS.every((column) => availableColumns.has(column)),
    };

    return auditLogColumnState;
};

const withExplicitColumnFallback = (columnState, columnName, fallbackExpression) => {
    if (columnState.supportsExplicitColumns) {
        return `COALESCE(l.${columnName}, ${fallbackExpression})`;
    }

    return fallbackExpression;
};

const withMetadataFallback = (columnState, metadataExpression, defaultExpression = 'NULL') => {
    if (columnState.hasMetadataColumn) {
        return metadataExpression;
    }

    return defaultExpression;
};

exports.logAction = async ({
    req = null,
    userId = null,
    action,
    description,
    metadata = {},
    actorRole = null,
    actorType = null,
    actorName = null,
    targetType = null,
    targetId = null,
    success = true,
    statusCode = null,
    beforeState = null,
    afterState = null,
}) => {
    try {
        if (!action || EXCLUDED_AUDIT_ACTIONS.has(action)) {
            return;
        }

        const columnState = await loadAuditLogColumnState();
        const requestUser = req?.user || null;
        const resolvedUserId = userId || requestUser?.id || null;
        const resolvedActorRole = actorRole || requestUser?.role || null;
        const resolvedActorType = actorType || getActorTypeFromRole(resolvedActorRole);
        const resolvedActorName = actorName || metadata.actor_name || null;
        const resolvedTargetType = targetType || metadata.target_type || null;
        const resolvedTargetId = targetId || metadata.target_id || null;
        const serializedBeforeState = getSerializableSnapshot(beforeState);
        const serializedAfterState = getSerializableSnapshot(afterState);

        const finalMetadata = sanitizeMetadata({
            ...metadata,
            actor_role: resolvedActorRole,
            actor_type: resolvedActorType,
            actor_name: resolvedActorName,
            target_type: resolvedTargetType,
            target_id: resolvedTargetId,
            success,
            status_code: statusCode || null,
            entity_before: serializedBeforeState,
            entity_after: serializedAfterState,
            ...buildRequestContext(req),
        });

        const columns = ['user_id', 'action_type', 'description'];
        const values = [resolvedUserId, action, description];

        if (columnState.hasMetadataColumn) {
            columns.push('metadata');
            values.push(JSON.stringify(finalMetadata));
        }

        if (columnState.supportsExplicitColumns) {
            columns.push(
                'actor_role',
                'actor_type',
                'actor_name',
                'target_type',
                'target_id',
                'route',
                'request_method',
                'ip_address',
                'user_agent',
                'success',
                'status_code',
                'entity_before',
                'entity_after'
            );
            values.push(
                resolvedActorRole,
                resolvedActorType,
                resolvedActorName,
                resolvedTargetType,
                resolvedTargetId,
                finalMetadata.route,
                finalMetadata.method,
                finalMetadata.ip_address,
                finalMetadata.user_agent,
                success,
                statusCode || null,
                serializedBeforeState ? JSON.stringify(serializedBeforeState) : null,
                serializedAfterState ? JSON.stringify(serializedAfterState) : null
            );
        }

        const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
        const query = `
            INSERT INTO audit_logs (${columns.join(', ')})
            VALUES (${placeholders})
        `;

        await db.query(query, values);
    } catch (err) {
        console.error('Audit Log Failed:', err.message);
    }
};

exports.fetchAuditLogs = async ({ limit = null } = {}) => {
    const columnState = await loadAuditLogColumnState();
    const excludedActions = Array.from(EXCLUDED_AUDIT_ACTIONS);
    const values = [excludedActions];
    let limitClause = '';

    if (Number.isInteger(limit) && limit > 0) {
        values.push(limit);
        limitClause = `LIMIT $${values.length}`;
    }

    const actorRoleExpr = withExplicitColumnFallback(
        columnState,
        'actor_role',
        `COALESCE(${withMetadataFallback(columnState, `l.metadata->>'actor_role'`)}, s.role::text, 'System')`
    );
    const actorTypeExpr = withExplicitColumnFallback(
        columnState,
        'actor_type',
        `COALESCE(${withMetadataFallback(columnState, `l.metadata->>'actor_type'`)}, CASE WHEN s.id IS NOT NULL THEN 'staff' END, 'system')`
    );
    const actorNameExpr = withExplicitColumnFallback(
        columnState,
        'actor_name',
        withMetadataFallback(columnState, `l.metadata->>'actor_name'`)
    );
    const targetTypeExpr = withExplicitColumnFallback(
        columnState,
        'target_type',
        withMetadataFallback(columnState, `l.metadata->>'target_type'`)
    );
    const targetIdExpr = withExplicitColumnFallback(
        columnState,
        'target_id',
        withMetadataFallback(columnState, `l.metadata->>'target_id'`)
    );
    const routeExpr = withExplicitColumnFallback(
        columnState,
        'route',
        withMetadataFallback(columnState, `l.metadata->>'route'`)
    );
    const methodExpr = withExplicitColumnFallback(
        columnState,
        'request_method',
        withMetadataFallback(columnState, `l.metadata->>'method'`)
    );
    const ipExpr = withExplicitColumnFallback(
        columnState,
        'ip_address',
        withMetadataFallback(columnState, `l.metadata->>'ip_address'`)
    );
    const userAgentExpr = withExplicitColumnFallback(
        columnState,
        'user_agent',
        withMetadataFallback(columnState, `l.metadata->>'user_agent'`)
    );
    const successExpr = withExplicitColumnFallback(
        columnState,
        'success',
        withMetadataFallback(columnState, `NULLIF(l.metadata->>'success', '')::boolean`)
    );
    const statusCodeExpr = withExplicitColumnFallback(
        columnState,
        'status_code',
        withMetadataFallback(columnState, `NULLIF(l.metadata->>'status_code', '')::integer`)
    );
    const beforeStateExpr = columnState.supportsExplicitColumns
        ? `COALESCE(l.entity_before, ${withMetadataFallback(columnState, `l.metadata->'entity_before'`)})`
        : withMetadataFallback(columnState, `l.metadata->'entity_before'`);
    const afterStateExpr = columnState.supportsExplicitColumns
        ? `COALESCE(l.entity_after, ${withMetadataFallback(columnState, `l.metadata->'entity_after'`)})`
        : withMetadataFallback(columnState, `l.metadata->'entity_after'`);
    const metadataSelectExpr = columnState.hasMetadataColumn ? 'l.metadata' : 'NULL::jsonb AS metadata';

    const query = `
        SELECT
            l.id,
            l.user_id,
            l.action_type,
            l.description,
            ${metadataSelectExpr},
            l.created_at,
            ${actorNameExpr} AS actor_name,
            COALESCE(
                s.full_name,
                NULLIF(TRIM(CONCAT(COALESCE(a.surname, ''), ' ', COALESCE(a.other_names, ''))), ''),
                ${actorNameExpr},
                CASE
                    WHEN ${actorTypeExpr} = 'system' THEN 'System'
                    ELSE NULL
                END,
                'Unknown Actor'
            ) AS staff_name,
            ${actorRoleExpr} AS actor_role,
            ${actorTypeExpr} AS actor_type,
            ${targetTypeExpr} AS target_type,
            ${targetIdExpr} AS target_id,
            ${routeExpr} AS route,
            ${methodExpr} AS request_method,
            ${ipExpr} AS ip_address,
            ${userAgentExpr} AS user_agent,
            ${successExpr} AS success,
            ${statusCodeExpr} AS status_code,
            ${beforeStateExpr} AS entity_before,
            ${afterStateExpr} AS entity_after
        FROM audit_logs l
        LEFT JOIN staff_accounts s ON l.user_id = s.id
        LEFT JOIN student_users su ON l.user_id = su.id
        LEFT JOIN applications a ON su.application_id = a.id
        WHERE NOT (l.action_type = ANY($1))
        ORDER BY l.created_at DESC
        ${limitClause}
    `;

    const result = await db.query(query, values);
    return result.rows;
};

exports.attachAuditHelpers = (req, res, next) => {
    req.audit = {
        log: (payload) => exports.logAction({ req, ...payload }),
    };
    next();
};
