import { renderPage } from '../../renderer.js';
import { CommunicationPage } from '../../pages/ims/communication/communication-page.jsx';
import { ConversationsPage } from '../../pages/ims/communication/conversations-page.jsx';
import { ConversationDetailPage } from '../../pages/ims/communication/conversation-detail-page.jsx';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { isErr, unwrap } from '../../../../../lib/trust/index.js';

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
    const tenantId = c.get('tenantId');
    const { listConversations } = c.ctx.get('domain.communication').useCases;
    const { items } = await listConversations(tenantId, { limit: 20 });

    // Enrich with Participant Names
    const ac = c.ctx.get('domain.access-control');
    if (items.length > 0 && ac) {
        const userIds = new Set();
        items.forEach(c => c.participantIds?.forEach(id => userIds.add(id)));
        // Also senderId?

        if (userIds.size > 0 && ac.repositories.user.findByIds) {
             const usersRes = await ac.repositories.user.findByIds(tenantId, Array.from(userIds));
             if (!isErr(usersRes)) {
                 const userMap = new Map(usersRes.value.map(u => [u.id, u.name]));
                 for (const conv of items) {
                     conv.participants = (conv.participantIds || []).map(id => userMap.get(id) || id);

                     // Try to guess Last Sender Name
                     // Note: conv doesn't store lastSenderId, only lastMessagePreview.
                     // Ideally we fetch the last message. But for MVP list:
                     conv.lastSender = 'Someone'; // Placeholder until we join messages
                 }
             }
        }
    }

    // Ensure participants array exists even if enrichment failed
    items.forEach(c => {
        if (!c.participants) c.participants = c.participantIds || [];
    });

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
    const { items } = await notifications.list(c.get('tenantId'), { limit: 50, userId: user.id });

    return c.html(await renderPage(CommunicationPage, {
        activeTab: 'notifications',
        notifications: items,
        layout: AdminLayout,
        title: 'Notifications - Communication',
        user: c.get('user')
    }));
};
