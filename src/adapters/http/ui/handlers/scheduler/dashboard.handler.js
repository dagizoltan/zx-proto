
import { renderPage } from '../../renderer.js';
import { SchedulerDashboardPage } from '../../pages/ims/scheduler/scheduler-dashboard.jsx';

export const schedulerDashboardHandler = async (c) => {
    const tenantId = c.get('tenantId') || 'default';
    const scheduler = c.ctx.get('domain.scheduler').service;

    // Aggregate stats manually or via service method
    const tasks = await scheduler.listTasks(tenantId);
    const history = await scheduler.getHistory(tenantId);

    const stats = {
        totalTasks: tasks.length,
        activeTasks: tasks.filter(t => t.enabled).length,
        failingTasks: tasks.filter(t => t.status === 'FAILURE').length, // Current status
        lastRun: history[0]?.startTime || null
    };

    return renderPage(c, SchedulerDashboardPage, { stats }, { title: 'Scheduler Dashboard' });
};
