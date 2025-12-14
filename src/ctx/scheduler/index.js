import { createSchedulerService } from './domain/services/scheduler-service.js';
import { createKVScheduledTaskRepository } from './infrastructure/adapters/kv-scheduled-task-repository.adapter.js';
import { createKVTaskExecutionRepository } from './infrastructure/adapters/kv-task-execution-repository.adapter.js';
import { resolveDependencies } from '../../utils/registry/dependency-resolver.js';
import { createContextBuilder } from '../../utils/registry/context-builder.js';

export const createSchedulerContext = async (deps) => {
  const { kvPool, eventBus } = resolveDependencies(deps, {
    kvPool: ['persistence.kvPool', 'kvPool'],
    eventBus: ['messaging.eventBus', 'eventBus']
  });

  const taskRepo = createKVScheduledTaskRepository(kvPool);
  const executionRepo = createKVTaskExecutionRepository(kvPool);

  const service = createSchedulerService({
      taskRepo,
      executionRepo,
      eventBus
  });

  // Note: Handlers and Definitions are now loaded in bootstrap phase to keep context pure

  return createContextBuilder('scheduler')
    .withRepositories({
        tasks: taskRepo,
        executions: executionRepo
    })
    .withServices({
        scheduler: service
    })
    // Expose service directly on context for backward compatibility/bootstrap access
    .withProps({
        scheduler: service
    })
    .build();
};

export const SchedulerContext = {
    name: 'scheduler',
    dependencies: [
        'infra.persistence',
        'infra.messaging',
        'domain.system'
    ],
    factory: createSchedulerContext
};
