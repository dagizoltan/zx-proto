import { Hono } from 'hono';
import * as handlers from '../../handlers/system.handlers.js';

export const systemRoutes = new Hono();

// Settings
systemRoutes.get('/settings', handlers.settingsHandler);

// Notifications -> Moved to Communication Hub
// Audit Logs -> Moved to Observability
