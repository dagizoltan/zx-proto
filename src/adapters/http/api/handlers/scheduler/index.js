
export const listTasksHandler = async (c) => {
    const tenantId = c.get('tenantId') || 'default';
    const scheduler = c.ctx.get('domain.scheduler').services.scheduler;
    const tasks = await scheduler.listTasks(tenantId);
    return c.json({ data: tasks });
};

export const updateTaskHandler = async (c) => {
    const tenantId = c.get('tenantId') || 'default';
    const scheduler = c.ctx.get('domain.scheduler').services.scheduler;
    const id = c.req.param('id');
    const body = await c.req.json();

    const task = await scheduler.getTask(tenantId, id);
    if (!task) return c.json({ error: 'Task not found' }, 404);

    const updated = await scheduler.updateTask(tenantId, {
        ...task,
        enabled: body.enabled !== undefined ? body.enabled : task.enabled,
        cronExpression: body.cronExpression || task.cronExpression,
        updatedAt: new Date()
    });

    return c.json({ data: updated });
};

export const runTaskHandler = async (c) => {
    const tenantId = c.get('tenantId') || 'default';
    const scheduler = c.ctx.get('domain.scheduler').services.scheduler;
    const id = c.req.param('id');

    try {
        scheduler.executeTask(tenantId, id, true);
        return c.json({ message: 'Task execution started' });
    } catch (e) {
        return c.json({ error: e.message }, 400);
    }
};

export const listHistoryHandler = async (c) => {
    const tenantId = c.get('tenantId') || 'default';
    const scheduler = c.ctx.get('domain.scheduler').services.scheduler;
    const history = await scheduler.getHistory(tenantId);
    return c.json({ data: history });
};

export const getDashboardHandler = async (c) => {
    const tenantId = c.get('tenantId') || 'default';
    const scheduler = c.ctx.get('domain.scheduler').services.scheduler;
    const tasks = await scheduler.listTasks(tenantId);
    const history = await scheduler.getHistory(tenantId);

    const stats = {
        totalTasks: tasks.length,
        activeTasks: tasks.filter(t => t.enabled).length,
        failingTasks: tasks.filter(t => t.status === 'FAILURE' || (t.lastRunAt && history.find(h => h.taskId === t.id && h.status === 'FAILURE'))).length,
        lastRun: history[0]?.startTime || null
    };

    return c.json({ data: stats });
};
