
import { createSchedulerService } from './domain/services/scheduler-service.js';
import { createKVScheduledTaskRepository } from './infrastructure/adapters/kv-scheduled-task-repository.adapter.js';
import { createKVTaskExecutionRepository } from './infrastructure/adapters/kv-task-execution-repository.adapter.js';
import { schedulerTaskHandlers } from '../../adapters/scheduler/task-handlers.js';

/**
 * Scheduler Context Factory
 *
 * @param {Object} deps - Explicit DI
 * @param {Object} deps.kvPool
 * @param {Object} deps.eventBus
 */
export const createSchedulerContext = async ({ kvPool, eventBus }) => {

  const taskRepo = createKVScheduledTaskRepository(kvPool);
  const executionRepo = createKVTaskExecutionRepository(kvPool);

  const service = createSchedulerService({
      taskRepo,
      executionRepo,
      eventBus
  });

  if (schedulerTaskHandlers) {
      for (const [key, handler] of Object.entries(schedulerTaskHandlers)) {
          service.registerHandler(key, handler);
      }
  }

  const definitions = Object.keys(schedulerTaskHandlers || {}).map(key => ({
      handlerKey: key,
      name: key.replace(/-/g, ' ').toUpperCase(),
      description: 'System Task',
      defaultSchedule: '0 0 * * *'
  }));

  await service.syncDefinitions('default', definitions);

  return {
    name: 'scheduler',
    repositories: {
        tasks: taskRepo,
        executions: executionRepo
    },
    services: {
        scheduler: service
    }
  };
};
