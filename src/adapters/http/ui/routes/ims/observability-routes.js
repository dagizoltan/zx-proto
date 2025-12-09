import { Hono } from 'hono';
import * as handlers from '../../handlers/observability/logs.handlers.js';

export const observabilityRoutes = new Hono();

observabilityRoutes.get('/logs', handlers.logsPageHandler);
observabilityRoutes.get('/activity', handlers.activityPageHandler);
observabilityRoutes.get('/audit', handlers.auditPageHandler);
