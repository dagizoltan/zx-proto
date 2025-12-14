import { Hono } from 'hono';
import * as handlers from '../../handlers/communication/communication.handlers.js';
import * as postFeedHandlers from '../../handlers/communication/post-feed.handler.js';

export const communicationRoutes = new Hono();

communicationRoutes.get('/feed', handlers.feedHandler);
communicationRoutes.get('/feed/new', postFeedHandlers.getCreateFeedPostPage);
communicationRoutes.post('/feed/new', postFeedHandlers.handleCreateFeedPost);
communicationRoutes.get('/conversations', handlers.conversationsHandler);
communicationRoutes.get('/conversations/new', handlers.createConversationPageHandler);
communicationRoutes.post('/conversations', handlers.createConversationActionHandler);
communicationRoutes.get('/conversations/:id', handlers.conversationDetailHandler);
// Keep legacy /messages redirect or drop it? Let's redirect for safety or just drop.
// Dropping since we update nav.

communicationRoutes.get('/notifications', handlers.notificationsHandler);
