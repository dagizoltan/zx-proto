
import { createBaseRepository } from '../../../../infra/persistence/kv/repositories/base-repository.js';
import { createScheduledTask } from '../entities/scheduled-task.js';

export const createKVScheduledTaskRepository = (kvPool) => {
  const base = createBaseRepository(kvPool, 'scheduled_tasks', createScheduledTask);

  return {
    ...base,
    save: async (tenantId, entity) => {
        const data = entity.toJSON ? entity.toJSON() : entity;

        await kvPool.withConnection(async (kv) => {
            const primaryKey = ['tenants', tenantId, 'scheduled_tasks', data.id];
            const activeKey = ['tenants', tenantId, 'scheduled_tasks_active', data.id];

            const atomic = kv.atomic()
                .set(primaryKey, data);

            if (data.enabled) {
                atomic.set(activeKey, data.id);
            } else {
                atomic.delete(activeKey);
            }

            await atomic.commit();
        });
        return entity;
    },
    findActive: async (tenantId) => {
        return kvPool.withConnection(async (kv) => {
            const iter = kv.list({ prefix: ['tenants', tenantId, 'scheduled_tasks_active'] });
            const keys = [];
            for await (const res of iter) {
                keys.push(['tenants', tenantId, 'scheduled_tasks', res.value]);
            }

            if (keys.length === 0) return [];

            // Batch fetch logic (manual chunking for safety)
            const BATCH_SIZE = 10;
            const results = [];
            for (let i = 0; i < keys.length; i += BATCH_SIZE) {
                const chunk = keys.slice(i, i + BATCH_SIZE);
                const chunkRes = await kv.getMany(chunk);
                results.push(...chunkRes);
            }

            return results
                .map(r => r.value)
                .filter(v => v !== null)
                .map(createScheduledTask);
        });
    },
    findByHandlerKey: async (tenantId, handlerKey) => {
        // Since we don't have a direct index, we use list and find.
        // Tasks are few (<50), so this is acceptable.
        // Ideally, we'd add a secondary index if this grows.
        const { items: tasks } = await base.findAll(tenantId, { limit: 100 });
        return tasks.find(t => t.handlerKey === handlerKey) || null;
    }
  };
};
