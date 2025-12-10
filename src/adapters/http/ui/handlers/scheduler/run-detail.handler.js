
import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { RunDetailPage } from '../../pages/ims/scheduler/run-detail-page.jsx';

// GET /ims/scheduler/history/:id
export const runDetailHandler = async (c) => {
    // FIX: Correct dependency resolution
    const scheduler = c.ctx.get('domain.scheduler').service;
    const tenantId = c.get('tenantId') || 'default';
    const runId = c.req.param('id');
    const success = c.req.query('success');
    const error = c.req.query('error');

    const history = await scheduler.getHistory(tenantId);
    const run = history.find(r => r.id === runId);

    if (!run) return c.text('Execution not found', 404);

    const task = await scheduler.getTask(tenantId, run.taskId);

    return c.html(await renderPage(RunDetailPage, {
        layout: AdminLayout,
        title: `Execution ${run.id.substring(0,8)}`,
        user: c.get('user'),
        run,
        task,
        error,
        success
    }));
};

// POST /ims/scheduler/history/:id/retry
export const retryTaskHandler = async (c) => {
    // FIX: Correct dependency resolution
    const scheduler = c.ctx.get('domain.scheduler').service;
    const tenantId = c.get('tenantId') || 'default';
    const runId = c.req.param('id');

    const history = await scheduler.getHistory(tenantId);
    const run = history.find(r => r.id === runId);

    if (!run) return c.text('Execution not found', 404);

    try {
        await scheduler.executeTask(tenantId, run.taskId, true);
        return c.redirect(`/ims/scheduler/history/${runId}?success=Retry initiated (new execution created).`);
    } catch (e) {
        return c.redirect(`/ims/scheduler/history/${runId}?error=${encodeURIComponent(e.message)}`);
    }
};
