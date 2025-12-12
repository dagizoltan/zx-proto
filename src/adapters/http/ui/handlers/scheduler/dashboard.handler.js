
import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { SchedulerDashboardPage } from '../../pages/ims/scheduler/scheduler-dashboard.jsx';

export const schedulerDashboardHandler = async (c) => {
    // FIX: Correct dependency resolution
    const scheduler = c.ctx.get('domain.scheduler').services.scheduler;
    const tenantId = c.get('tenantId') || 'default';

    // Fetch data
    const tasks = await scheduler.listTasks(tenantId);
    const history = await scheduler.getHistory(tenantId);

    // --- Metrics Calculations ---
    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

    // 1. Success Rate (Last 24h)
    const recentExecutions = history.filter(e => new Date(e.startTime) > oneDayAgo);
    const successCount = recentExecutions.filter(e => e.status === 'SUCCESS').length;
    const failureCount = recentExecutions.filter(e => e.status === 'FAILURE').length;
    const totalRecent = successCount + failureCount;
    const successRate = totalRecent > 0 ? Math.round((successCount / totalRecent) * 100) : 100;

    // 2. Tasks Due Soon (Next 24h)
    const dueSoonCount = tasks.filter(t => t.enabled && t.nextRunAt && new Date(t.nextRunAt) < new Date(now.getTime() + 24*60*60*1000)).length;

    // 3. Average Runtime (Last 24h)
    const finishedExecs = recentExecutions.filter(e => e.endTime);
    let totalRuntimeMs = 0;
    finishedExecs.forEach(e => {
        totalRuntimeMs += (new Date(e.endTime) - new Date(e.startTime));
    });
    const avgRuntime = finishedExecs.length > 0 ? (totalRuntimeMs / finishedExecs.length / 1000).toFixed(2) + 's' : '0s';

    // 4. Critical Failures (Last 24h)
    const criticalFailures = failureCount;

    // 5. Recent Activity List (Enriched)
    const enrichedRecent = history.sort((a,b) => new Date(b.startTime) - new Date(a.startTime)).slice(0, 10).map(run => {
        const task = tasks.find(t => t.id === run.taskId);
        return {
            ...run,
            taskName: task ? task.name : 'Unknown Task'
        };
    });

    const activeTasks = tasks.filter(t => t.status === 'RUNNING' || t.enabled).slice(0, 5);

    return c.html(await renderPage(SchedulerDashboardPage, {
        layout: AdminLayout,
        title: 'Scheduler Dashboard',
        user: c.get('user'),
        stats: {
            successRate,
            dueSoonCount,
            avgRuntime,
            criticalFailures,
            totalRecent
        },
        recentExecutions: enrichedRecent,
        activeTasks
    }));
};
