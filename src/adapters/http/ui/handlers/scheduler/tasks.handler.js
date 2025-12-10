
import { renderPage } from '../../renderer.js';
import { TaskDefinitionsPage } from '../../pages/ims/scheduler/task-definitions.jsx';

export const listTaskDefinitionsHandler = async (c) => {
    const tenantId = c.get('tenantId') || 'default';
    const scheduler = c.ctx.get('domain.scheduler').service;
    const tasks = await scheduler.listTasks(tenantId);

    return renderPage(c, TaskDefinitionsPage, { tasks }, { title: 'Task Definitions' });
};
