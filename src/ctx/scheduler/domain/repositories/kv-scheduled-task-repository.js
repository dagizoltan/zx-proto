
import { createBaseRepository } from '../../../../infra/persistence/kv/repositories/base-repository.js';
import { createScheduledTask } from '../entities/scheduled-task.js';

export const createKVScheduledTaskRepository = (kvPool) => {
  const base = createBaseRepository(kvPool, 'scheduled_tasks', createScheduledTask);

  return {
    ...base,
    findByHandlerKey: async (tenantId, handlerKey) => {
        // Since we don't have a direct index, we use list and find.
        // Tasks are few (<50), so this is acceptable.
        // Ideally, we'd add a secondary index if this grows.
        const { items: tasks } = await base.findAll(tenantId, { limit: 100 });
        return tasks.find(t => t.handlerKey === handlerKey) || null;
    }
  };
};
