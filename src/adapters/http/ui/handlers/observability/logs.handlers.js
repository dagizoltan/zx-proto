import { renderPage } from '../../renderer.js';
import { LogsPage } from '../../pages/ims/observability/logs-page.jsx';
import { AdminLayout } from '../../layouts/admin-layout.jsx';

// --- Handlers ---

export const logsPageHandler = async (c) => {
    const { listLogs } = c.ctx.get('domain.observability').useCases;
    const cursor = c.req.query('cursor');
    const level = c.req.query('level') || 'INFO';

    const { items, nextCursor } = await listLogs.execute(c.get('tenantId'), { level, cursor });

    return c.html(await renderPage(LogsPage, {
        title: 'System Logs',
        activeTab: 'logs',
        logs: items,
        nextCursor,
        layout: AdminLayout
    }));
};

export const activityPageHandler = async (c) => {
    const { listActivityLogs } = c.ctx.get('domain.observability').useCases;
    const cursor = c.req.query('cursor');

    const { items, nextCursor } = await listActivityLogs.execute(c.get('tenantId'), { cursor });

    return c.html(await renderPage(LogsPage, {
        title: 'User Activity',
        activeTab: 'activity',
        logs: items,
        nextCursor,
        layout: AdminLayout
    }));
};

export const auditPageHandler = async (c) => {
    const { listAuditLogs } = c.ctx.get('domain.observability').useCases;
    const cursor = c.req.query('cursor');

    const { items, nextCursor } = await listAuditLogs.execute(c.get('tenantId'), { cursor });

    return c.html(await renderPage(LogsPage, {
        title: 'Audit Trail',
        activeTab: 'audit',
        logs: items,
        nextCursor,
        layout: AdminLayout
    }));
};
