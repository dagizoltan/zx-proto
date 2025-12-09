import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth-middleware.js';
import * as handlers from '../handlers/communication/index.js';

export const communicationRoutes = new Hono();

communicationRoutes.use('*', authMiddleware);

communicationRoutes.get('/feed', handlers.listFeedHandler);
communicationRoutes.get('/messages', handlers.listMessagesHandler);
communicationRoutes.get('/notifications', handlers.listNotificationsHandler);
