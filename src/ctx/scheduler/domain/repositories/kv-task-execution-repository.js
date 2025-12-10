
import { createBaseRepository } from '../../../infra/persistence/kv/repositories/base-repository.js';
import { createTaskExecution } from '../entities/task-execution.js';

export const createKVTaskExecutionRepository = (kvPool) => {
  const base = createBaseRepository(kvPool, 'task_executions', createTaskExecution);

  return {
    ...base,
    // Add specific methods for history if needed (e.g. by taskId)
    findByTaskId: async (tenantId, taskId, limit = 50) => {
        // Naive implementation using findAll + sort
        // In prod, use secondary index or composite keys
        const all = await base.findAll(tenantId);
        return all
            .filter(e => e.taskId === taskId)
            .sort((a, b) => b.startTime - a.startTime)
            .slice(0, limit);
    }
  };
};
