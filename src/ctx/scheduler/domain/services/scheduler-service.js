
import { createScheduledTask } from '../entities/scheduled-task.js';
import { createTaskExecution } from '../entities/task-execution.js';
import parser from 'cron-parser';
import { isErr, unwrap } from '../../../../../lib/trust/index.js';

export const createSchedulerService = ({ taskRepo, executionRepo, eventBus, crm }) => {
  const logger = console;

  const handlers = new Map();

  const registerHandler = (key, handler) => {
    handlers.set(key, handler);
  };

  const syncDefinitions = async (tenantId, definitions) => {
    for (const def of definitions) {
      // FIX: Use handlerKey
      const qRes = await taskRepo.queryByIndex(tenantId, 'handlerKey', def.handlerKey);
      const existing = !isErr(qRes) && qRes.value.items.length > 0 ? qRes.value.items[0] : null;

      if (existing) {
        await taskRepo.save(tenantId, createScheduledTask({
          ...existing,
          name: def.name,
          description: def.description,
          updatedAt: new Date().toISOString()
        }));
      } else {
        await taskRepo.save(tenantId, createScheduledTask({
          id: crypto.randomUUID(),
          tenantId,
          handlerKey: def.handlerKey,
          name: def.name,
          description: def.description,
          cronExpression: def.defaultSchedule,
          enabled: true
        }));
      }
    }
  };

  const isDue = (task) => {
    if (!task.enabled || !task.cronExpression) return false;
    try {
      const interval = parser.parseExpression(task.cronExpression);
      const prev = interval.prev().toDate();
      if (!task.lastRunAt) return true;
      return prev > new Date(task.lastRunAt);
    } catch (e) {
      logger.error(`Invalid cron for ${task.name}: ${e.message}`);
      return false;
    }
  };

  const executeTask = async (tenantId, taskId, isManual = false) => {
    const tRes = await taskRepo.findById(tenantId, taskId);
    if (isErr(tRes)) throw new Error('Task not found');
    const task = tRes.value;

    const handler = handlers.get(task.handlerKey);
    if (!handler) {
        logger.error(`No handler registered for ${task.handlerKey}`);
        return;
    }

    const executionId = crypto.randomUUID();
    const execution = {
        id: executionId,
        tenantId,
        taskId: task.id,
        handlerKey: task.handlerKey,
        startTime: new Date().toISOString(),
        status: 'RUNNING',
        logs: [`Starting task ${task.name}`]
    };

    await taskRepo.save(tenantId, { ...task, lastRunAt: new Date().toISOString() });
    await executionRepo.save(tenantId, execution);

    const logBuffer = [`Starting task ${task.name}`];
    const logFn = (msg) => logBuffer.push(`[${new Date().toISOString()}] ${msg}`);

    // Notify Start (Fire and Forget)
    if (crm && crm.notifications) {
        crm.notifications.notify(tenantId, {
            userId: 'admin', // Hardcoded per plan
            title: 'Task Started',
            message: `Scheduled task '${task.name}' has started.`,
            level: 'INFO',
            link: '/admin/scheduler'
        }).catch(e => logger.error(`Failed to send start notification: ${e}`));
    }

    try {
        await handler({
            log: logFn,
            tenantId
        });

        await executionRepo.save(tenantId, {
            ...execution,
            endTime: new Date().toISOString(),
            status: 'SUCCESS',
            logs: logBuffer
        });

        // Notify Success
        if (crm && crm.notifications) {
            crm.notifications.notify(tenantId, {
                userId: 'admin',
                title: 'Task Completed',
                message: `Task '${task.name}' completed successfully.`,
                level: 'SUCCESS',
                link: `/admin/scheduler/executions/${execution.id}`
            }).catch(e => logger.error(`Failed to send success notification: ${e}`));
        }

    } catch (error) {
        await executionRepo.save(tenantId, {
            ...execution,
            endTime: new Date().toISOString(),
            status: 'FAILED',
            error: error.message,
            logs: [...logBuffer, `Error: ${error.message}`]
        });

        // Notify Failure
        if (crm && crm.notifications) {
            crm.notifications.notify(tenantId, {
                userId: 'admin',
                title: 'Task Failed',
                message: `Task '${task.name}' failed: ${error.message}`,
                level: 'ERROR',
                link: `/admin/scheduler/executions/${execution.id}`
            }).catch(e => logger.error(`Failed to send failure notification: ${e}`));
        }
    }
  };

  const tick = async (tenantId = 'default') => {
    // FIX: Query enabled tasks using 'enabled' index
    const qRes = await taskRepo.queryByIndex(tenantId, 'enabled', 'true');
    if (isErr(qRes)) return;
    const tasks = qRes.value.items;

    const executions = [];
    for (const task of tasks) {
        if (isDue(task)) {
             executions.push(
                executeTask(tenantId, task.id).catch(e => logger.error(`Execution fail wrapper: ${e}`))
            );
        }
    }
    await Promise.all(executions);
  };

  return {
    registerHandler,
    syncDefinitions,
    tick,
    executeTask,
    listTasks: async (tenantId) => {
        const res = await taskRepo.list(tenantId, { limit: 100 });
        return unwrap(res).items;
    },
    getTask: (tenantId, id) => taskRepo.findById(tenantId, id),
    updateTask: (tenantId, task) => taskRepo.save(tenantId, task),
    getHistory: async (tenantId) => {
         const res = await executionRepo.list(tenantId, { limit: 100 });
         return unwrap(res).items;
    }
  };
};
