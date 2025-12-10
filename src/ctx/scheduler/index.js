
import { createKVScheduledTaskRepository } from './domain/repositories/kv-scheduled-task-repository.js';
import { createKVTaskExecutionRepository } from './domain/repositories/kv-task-execution-repository.js';
import { createSchedulerService } from './domain/services/scheduler-service.js';

export const createSchedulerContext = (deps) => {
    // 1. Resolve dependencies
    const kvPool = deps['infra.persistence'];
    const eventBus = deps['infra.messaging'];
    const registry = deps.registry;

    // 2. Create Repositories
    const taskRepo = createKVScheduledTaskRepository(kvPool);
    const executionRepo = createKVTaskExecutionRepository(kvPool);

    // 3. Create Services
    const service = createSchedulerService({
        taskRepo,
        executionRepo,
        registry,
        eventBus
    });

    // 4. Return Interface
    return {
        service,
        repositories: {
            task: taskRepo,
            execution: executionRepo
        }
    };
};
