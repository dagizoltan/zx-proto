
import { renderPage } from '../../renderer.js';
import { TaskHistoryPage } from '../../pages/ims/scheduler/task-history.jsx';

export const listHistoryHandler = async (c) => {
    const tenantId = c.get('tenantId') || 'default';
    const scheduler = c.ctx.get('domain.scheduler').service;

    // Fetch both to map names
    const history = await scheduler.getHistory(tenantId);
    const tasks = await scheduler.listTasks(tenantId);

    // Sort history desc
    const sortedHistory = history.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

    return renderPage(c, TaskHistoryPage, { history: sortedHistory, tasks }, { title: 'Scheduler History' });
};
