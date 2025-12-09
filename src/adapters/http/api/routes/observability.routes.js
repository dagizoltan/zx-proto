import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth-middleware.js';
import { roleCheckMiddleware } from '../middleware/rbac-middleware.js';
import {
    listLogsHandler,
    listActivityLogsHandler,
    listAuditLogsHandler
} from '../handlers/observability/index.js';

export const observabilityRoutes = new Hono();

// Auth required
observabilityRoutes.use('*', authMiddleware);
// RBAC: Admin only for raw logs, maybe Manager for Activity/Audit?
// Let's keep it strict for now.
observabilityRoutes.use('*', roleCheckMiddleware(['admin']));

observabilityRoutes.get('/logs', listLogsHandler);
observabilityRoutes.get('/activity', listActivityLogsHandler);
observabilityRoutes.get('/audit', listAuditLogsHandler);
