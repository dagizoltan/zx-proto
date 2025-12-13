
import { createSchedulerService } from './domain/services/scheduler-service.js';
import { createKVScheduledTaskRepository } from './infrastructure/adapters/kv-scheduled-task-repository.adapter.js';
import { createKVTaskExecutionRepository } from './infrastructure/adapters/kv-task-execution-repository.adapter.js';
import { schedulerTaskHandlers } from '../../adapters/scheduler/task-handlers.js';

export const createSchedulerContext = async (deps) => {
  const { persistence, registry, messaging } = deps;
  const { eventBus } = messaging;

  const taskRepo = createKVScheduledTaskRepository(persistence.kvPool);
  const executionRepo = createKVTaskExecutionRepository(persistence.kvPool);

  const service = createSchedulerService({
      taskRepo,
      executionRepo,
      registry,
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
