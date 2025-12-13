import { Random, Log, Time } from './utils.js';
import { isErr, unwrap } from '../../../../../lib/trust/index.js';

export const seedScheduler = async (ctx, tenantId) => {
    Log.step('Seeding Scheduler History...');
    const schedulerCtx = ctx.get('domain.scheduler');
    const { scheduler } = schedulerCtx.services;
    const { tasks: taskRepo, executions: executionRepo } = schedulerCtx.repositories;

    // 1. Get existing tasks (synced by main/service)
    const tRes = await taskRepo.list(tenantId, { limit: 100 });
    if (isErr(tRes)) {
        console.warn('[WARN] Failed to list tasks for seeding history');
        return;
    }
    const tasks = tRes.value.items;

    if (tasks.length === 0) {
        console.warn('[WARN] No tasks found. Skipping execution history.');
        return;
    }

    Log.info(`Generating history for ${tasks.length} tasks...`);

    // 2. Generate history
    const totalRuns = 50;
    for (let i = 0; i < totalRuns; i++) {
        const task = Random.element(tasks);

        // Random time in last 7 days
        const startedAt = new Date(Date.now() - Random.int(0, 7 * 24 * 60 * 60 * 1000));
        const duration = Random.int(100, 5000);
        const completedAt = new Date(startedAt.getTime() + duration);

        const isSuccess = Math.random() > 0.1; // 90% success

        const execution = {
            id: crypto.randomUUID(),
            tenantId,
            taskId: task.id,
            handlerKey: task.handlerKey,
            startedAt: startedAt.toISOString(),
            completedAt: completedAt.toISOString(),
            status: isSuccess ? 'SUCCESS' : 'FAILED',
            durationMs: duration,
            result: isSuccess ? { itemsProcessed: Random.int(1, 100) } : undefined,
            error: isSuccess ? undefined : 'Random simulation failure'
        };

        try {
            await executionRepo.save(tenantId, execution);
        } catch (e) {
            console.error('Failed to seed execution', e);
        }
    }

    Log.success(`Seeded ${totalRuns} execution records.`);
};
