
import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { TaskDetailPage } from '../../pages/ims/scheduler/task-detail-page.jsx';

// GET /ims/scheduler/tasks/:id
export const taskDetailHandler = async (c) => {
    // FIX: Correct dependency resolution
    const scheduler = c.ctx.get('domain.scheduler').service;
    const tenantId = c.get('tenantId') || 'default';
    const taskId = c.req.param('id');
    const error = c.req.query('error');
    const success = c.req.query('success');

    const task = await scheduler.getTask(tenantId, taskId);
    if (!task) return c.text('Task not found', 404);

    const history = await scheduler.getHistory(tenantId);
    const taskHistory = history
        .filter(h => h.taskId === taskId)
        .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
        .slice(0, 10);

    return c.html(await renderPage(TaskDetailPage, {
        layout: AdminLayout,
        title: `Task: ${task.name}`,
        user: c.get('user'),
        task,
        history: taskHistory,
        error,
        success
    }));
};

// POST /ims/scheduler/tasks/:id
export const updateTaskHandler = async (c) => {
    // FIX: Correct dependency resolution
    const scheduler = c.ctx.get('domain.scheduler').service;
    const tenantId = c.get('tenantId') || 'default';
    const taskId = c.req.param('id');

    try {
        const body = await c.req.parseBody();
        const task = await scheduler.getTask(tenantId, taskId);

        if (!task) return c.text('Not found', 404);

        const updatedTask = {
            ...task,
            cronExpression: body.cronExpression,
            enabled: body.enabled === 'true',
            updatedAt: new Date()
        };

        await scheduler.updateTask(tenantId, updatedTask);
        return c.redirect(`/ims/scheduler/tasks/${taskId}?success=Configuration saved.`);
    } catch (e) {
        return c.redirect(`/ims/scheduler/tasks/${taskId}?error=${encodeURIComponent(e.message)}`);
    }
};

// POST /ims/scheduler/tasks/:id/run
export const runTaskHandler = async (c) => {
    // FIX: Correct dependency resolution
    const scheduler = c.ctx.get('domain.scheduler').service;
    const tenantId = c.get('tenantId') || 'default';
    const taskId = c.req.param('id');

    try {
        await scheduler.executeTask(tenantId, taskId, true);

        return c.redirect(`/ims/scheduler/tasks/${taskId}?success=Task executed successfully.`);
    } catch (e) {
        return c.redirect(`/ims/scheduler/tasks/${taskId}?error=${encodeURIComponent('Execution failed: ' + e.message)}`);
    }
};
