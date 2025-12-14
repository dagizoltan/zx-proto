import { renderPage } from '../../renderer.js';
import { CommunicationPage } from '../../pages/ims/communication/communication-page.jsx';
import { ConversationsPage } from '../../pages/ims/communication/conversations-page.jsx';
import { ConversationDetailPage } from '../../pages/ims/communication/conversation-detail-page.jsx';
import { CreateConversationPage } from '../../pages/ims/communication/create-conversation-page.jsx';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { isErr, unwrap } from '../../../../../../lib/trust/index.js';

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

    return c.html(await renderPage(ConversationsPage, {
        conversations: items,
        layout: AdminLayout,
        title: 'Conversations - Communication',
        user: c.get('user')
    }));
};

export const conversationDetailHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const { getConversation } = c.ctx.get('domain.communication').useCases;
    const conversationId = c.req.param('id');
    const conversation = await getConversation(tenantId, conversationId);

    if (!conversation) return c.text('Conversation not found', 404);

    return c.html(await renderPage(ConversationDetailPage, {
        conversation: conversation,
        layout: AdminLayout,
        title: `${conversation.subject || 'Conversation'} - Communication`,
        user: c.get('user')
    }));
};

export const createConversationPageHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const ac = c.ctx.get('domain.access-control');

    // This handler still directly accesses AC to list users for the "New Conversation" dropdown.
    // This is acceptable as UI Composition, or we could create a specialized use case in Communication "getPotentialParticipants".
    // For now, listing users is a generic AC function.
    let users = [];
    if (ac && ac.useCases.listUsers) { // Changed from repositories.user.list to useCases.listUsers for better practice
         const usersRes = await ac.useCases.listUsers(tenantId, { limit: 100 });
         if (!isErr(usersRes)) {
             users = usersRes.value.items;
         }
    }

    // Filter out current user?
    const currentUser = c.get('user');
    users = users.filter(u => u.id !== currentUser.id);

    return c.html(await renderPage(CreateConversationPage, {
        layout: AdminLayout,
        title: 'New Conversation - Communication',
        user: currentUser,
        users
    }));
};

export const createConversationActionHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const { sendMessage } = c.ctx.get('domain.communication').useCases;
    const user = c.get('user');

    const body = await c.req.parseBody();
    const { to, content } = body; // 'to' will be string or array of strings

    // If 'to' is missing
    if (!to) {
        return c.text('Recipients required', 400);
    }

    const recipients = Array.isArray(to) ? to : [to];

    const result = await sendMessage(tenantId, {
        from: user.id,
        to: recipients,
        content
    });

    if (isErr(result)) {
        return c.text(result.error.message, 400);
    }

    const { conversationId } = result.value;
    return c.redirect(`/ims/communication/conversations/${conversationId}`);
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
