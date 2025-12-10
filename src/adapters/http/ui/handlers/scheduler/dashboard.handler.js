
import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { SchedulerDashboardPage } from '../../pages/ims/scheduler/scheduler-dashboard.jsx';

export const schedulerDashboardHandler = async (c) => {
    const tenantId = c.get('tenantId') || 'default';
    const scheduler = c.ctx.get('domain.scheduler').service;
    const user = c.get('user');

    // Aggregate stats manually or via service method
    const tasks = await scheduler.listTasks(tenantId);
    const history = await scheduler.getHistory(tenantId);

    const stats = {
        totalTasks: tasks.length,
        activeTasks: tasks.filter(t => t.enabled).length,
        failingTasks: tasks.filter(t => t.status === 'FAILURE').length, // Current status
        lastRun: history[0]?.startTime || null
    };

    const html = await renderPage(SchedulerDashboardPage, {
        stats,
        user,
        layout: AdminLayout,
        title: 'Scheduler Dashboard',
        activePage: '/ims/scheduler/dashboard'
    });

    return c.html(html);
};
