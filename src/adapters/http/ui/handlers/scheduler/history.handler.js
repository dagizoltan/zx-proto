
import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { TaskHistoryPage } from '../../pages/ims/scheduler/task-history.jsx';

export const listHistoryHandler = async (c) => {
    const tenantId = c.get('tenantId') || 'default';
    const scheduler = c.ctx.get('domain.scheduler').service;
    const user = c.get('user');

    // Fetch both to map names
    const history = await scheduler.getHistory(tenantId);
    const tasks = await scheduler.listTasks(tenantId);

    // Sort history desc
    const sortedHistory = history.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

    const html = await renderPage(TaskHistoryPage, {
        history: sortedHistory,
        tasks,
        user,
        layout: AdminLayout,
        title: 'Scheduler History',
        activePage: '/ims/scheduler/history'
    });

    return c.html(html);
};
