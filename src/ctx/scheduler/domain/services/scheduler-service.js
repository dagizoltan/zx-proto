
import { createScheduledTask } from '../entities/scheduled-task.js';
import { createTaskExecution } from '../entities/task-execution.js';
import parser from 'cron-parser';

export const createSchedulerService = ({ taskRepo, executionRepo, registry, eventBus }) => {
  const logger = console; // Replace with proper logger if available

  // In-memory registry of actual handlers (functions)
  const handlers = new Map();

  const registerHandler = (key, handler) => {
    handlers.set(key, handler);
  };

  const syncDefinitions = async (tenantId, definitions) => {
    for (const def of definitions) {
      const existing = await taskRepo.findByHandlerKey(tenantId, def.handlerKey);

      if (existing) {
        // Update code-controlled fields (name, desc), preserve user-controlled (cron, enabled)
        await taskRepo.save(tenantId, createScheduledTask({
          ...existing,
          name: def.name,
          description: def.description,
          updatedAt: new Date()
        }));
      } else {
        // Create new
        await taskRepo.save(tenantId, createScheduledTask({
          id: crypto.randomUUID(),
          handlerKey: def.handlerKey,
          name: def.name,
          description: def.description,
          cronExpression: def.defaultSchedule,
          enabled: true,
          status: 'IDLE'
        }));
      }
    }
  };

  const isDue = (task) => {
    if (!task.enabled || !task.cronExpression) return false;

    try {
      const interval = parser.parseExpression(task.cronExpression);
      const prev = interval.prev().toDate();
      const now = new Date();

      // If the scheduled previous run was within the last minute, and we haven't run it yet...
      // Actually, a simpler robust check for "Master Ticker":
      // Check if "nextRunAt" is in the past.
      // But we need to calculate nextRunAt.

      // Better strategy:
      // 1. Calculate when it SHOULD have run most recently.
      // 2. If lastRunAt is before that, it's due.

      if (!task.lastRunAt) return true; // Never ran, run now

      return prev > task.lastRunAt;

    } catch (e) {
      logger.error(`Invalid cron for ${task.name}: ${e.message}`);
      return false;
    }
  };

  const executeTask = async (tenantId, taskId, isManual = false) => {
    const task = await taskRepo.findById(tenantId, taskId);
    if (!task) throw new Error('Task not found');

    const handler = handlers.get(task.handlerKey);
    if (!handler) {
        logger.error(`No handler registered for ${task.handlerKey}`);
        return;
    }

    const executionId = crypto.randomUUID();
    const execution = createTaskExecution({
        id: executionId,
        taskId: task.id,
        handlerKey: task.handlerKey,
        startTime: new Date(),
        status: 'RUNNING',
        logs: [`Starting task ${task.name} (${isManual ? 'MANUAL' : 'SCHEDULED'})`]
    });

    await executionRepo.save(tenantId, execution);
    await taskRepo.save(tenantId, createScheduledTask({ ...task, status: 'RUNNING', lastRunAt: new Date() }));

    try {
        const result = await handler({
            log: (msg) => execution.logs.push(`[${new Date().toISOString()}] ${msg}`),
            tenantId
        });

        const finalExec = createTaskExecution({
            ...execution,
            endTime: new Date(),
            status: 'SUCCESS',
            logs: [...execution.logs, 'Task completed successfully.']
        });
        await executionRepo.save(tenantId, finalExec);
        await taskRepo.save(tenantId, createScheduledTask({ ...task, status: 'IDLE' }));

    } catch (error) {
        const finalExec = createTaskExecution({
            ...execution,
            endTime: new Date(),
            status: 'FAILURE',
            error: error.message,
            logs: [...execution.logs, `Error: ${error.message}`]
        });
        await executionRepo.save(tenantId, finalExec);
        await taskRepo.save(tenantId, createScheduledTask({ ...task, status: 'IDLE' }));
    }
  };

  const tick = async (tenantId = 'default') => { // Default tenant for now
    const { items: tasks } = await taskRepo.findAll(tenantId, { limit: 100 });

    const executions = [];
    for (const task of tasks) {
        if (isDue(task) && task.status !== 'RUNNING') {
            executions.push(
                executeTask(tenantId, task.id).catch(e => logger.error(`Execution fail wrapper: ${e}`))
            );
        }
    }

    // We must await all tasks for Deno Deploy to keep the isolate alive
    await Promise.all(executions);
  };

  return {
    registerHandler,
    syncDefinitions,
    tick,
    executeTask,
    listTasks: async (tenantId) => {
        const { items } = await taskRepo.findAll(tenantId, { limit: 100 });
        return items;
    },
    getTask: (tenantId, id) => taskRepo.findById(tenantId, id),
    updateTask: (tenantId, task) => taskRepo.save(tenantId, task),
    getHistory: async (tenantId) => {
        const { items } = await executionRepo.findAll(tenantId, { limit: 100 });
        return items;
    }
  };
};
