import { Hono } from 'hono';
import * as handlers from '../../handlers/communication/hub.handlers.js';

export const communicationRoutes = new Hono();

communicationRoutes.get('/feed', handlers.feedHandler);
communicationRoutes.get('/messages', handlers.messagesHandler);
communicationRoutes.get('/notifications', handlers.notificationsHandler);
