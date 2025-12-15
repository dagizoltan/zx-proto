import { Hono } from 'hono';
import { settingsHandler } from '../../handlers/system/settings.handler.js';

export const systemRoutes = new Hono();

// Settings
systemRoutes.get('/settings', settingsHandler);

// Notifications -> Moved to Communication Hub
// Audit Logs -> Moved to Observability
