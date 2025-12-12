
import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { TaskDefinitionsPage } from '../../pages/ims/scheduler/task-definitions.jsx';

export const listTaskDefinitionsHandler = async (c) => {
    const tenantId = c.get('tenantId') || 'default';
    const scheduler = c.ctx.get('domain.scheduler').services.scheduler;
    const user = c.get('user');
    const tasks = await scheduler.listTasks(tenantId);

    const html = await renderPage(TaskDefinitionsPage, {
        tasks,
        user,
        layout: AdminLayout,
        title: 'Task Definitions',
        activePage: '/ims/scheduler/tasks'
    });

    return c.html(html);
};
