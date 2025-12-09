import { renderPage } from '../../renderer.js';
import { CommunicationPage } from '../../pages/ims/communication/communication-page.jsx';
import { AdminLayout } from '../../layouts/admin-layout.jsx';

// Handlers
export const feedHandler = async (c) => {
    const { getFeed } = c.ctx.get('domain.communication').useCases;
    const { items } = await getFeed(c.get('tenantId'), { limit: 20 });
    return c.html(await renderPage(CommunicationPage, {
        activeTab: 'feed',
        feed: items,
        layout: AdminLayout,
        title: 'Feed - Communication'
    }));
};

export const messagesHandler = async (c) => {
    const { listMessages } = c.ctx.get('domain.communication').useCases;
    const { items } = await listMessages(c.get('tenantId'), { limit: 20 });
    return c.html(await renderPage(CommunicationPage, {
        activeTab: 'messages',
        messages: items,
        layout: AdminLayout,
        title: 'Messages - Communication'
    }));
};

export const notificationsHandler = async (c) => {
    const { notifications } = c.ctx.get('domain.communication').useCases;
    const { items } = await notifications.list(c.get('tenantId'), { limit: 50 });
    return c.html(await renderPage(CommunicationPage, {
        activeTab: 'notifications',
        notifications: items,
        layout: AdminLayout,
        title: 'Notifications - Communication'
    }));
};
