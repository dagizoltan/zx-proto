import { renderPage } from '../../renderer.js';
import { CommunicationPage } from '../../pages/ims/communication/communication-page.jsx';
import { ConversationsPage } from '../../pages/ims/communication/conversations-page.jsx';
import { ConversationDetailPage } from '../../pages/ims/communication/conversation-detail-page.jsx';
import { AdminLayout } from '../../layouts/admin-layout.jsx';

// Handlers
export const feedHandler = async (c) => {
    const { getFeed } = c.ctx.get('domain.communication').useCases;
    const { items } = await getFeed(c.get('tenantId'), { limit: 20 });
    return c.html(await renderPage(CommunicationPage, {
        activeTab: 'feed',
        feed: items,
        layout: AdminLayout,
        title: 'Feed - Communication',
        user: c.get('user')
    }));
};

export const conversationsHandler = async (c) => {
    const { listConversations } = c.ctx.get('domain.communication').useCases;
    const { items } = await listConversations(c.get('tenantId'), { limit: 20 });
    return c.html(await renderPage(ConversationsPage, {
        conversations: items,
        layout: AdminLayout,
        title: 'Conversations - Communication',
        user: c.get('user')
    }));
};

export const conversationDetailHandler = async (c) => {
    const { getConversation } = c.ctx.get('domain.communication').useCases;
    const conversationId = c.req.param('id');
    const conversation = await getConversation(c.get('tenantId'), conversationId);

    if (!conversation) return c.text('Conversation not found', 404);

    return c.html(await renderPage(ConversationDetailPage, {
        conversation,
        layout: AdminLayout,
        title: `${conversation.subject || 'Conversation'} - Communication`,
        user: c.get('user')
    }));
};

export const notificationsHandler = async (c) => {
    const { notifications } = c.ctx.get('domain.communication').useCases;
    const user = c.get('user');
    // FIX: Pass userId to list notifications for current user
    const { items } = await notifications.list(c.get('tenantId'), { limit: 50, userId: user.id });

    return c.html(await renderPage(CommunicationPage, {
        activeTab: 'notifications',
        notifications: items,
        layout: AdminLayout,
        title: 'Notifications - Communication',
        user: c.get('user')
    }));
};
