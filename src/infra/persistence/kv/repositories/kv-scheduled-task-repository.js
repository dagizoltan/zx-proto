import { createRepository, useSchema, useIndexing } from '../../../../../lib/trust/index.js';
import { ScheduledTaskSchema } from '../../../../ctx/scheduler/domain/schemas/scheduler.schema.js';

export const createKVScheduledTaskRepository = (kvPool) => {
    return createRepository(kvPool, 'scheduled_tasks', [
        useSchema(ScheduledTaskSchema),
        useIndexing({
            'enabled': (t) => t.enabled ? 'true' : 'false',
            'handler': (t) => t.handlerKey
        })
    ]);
};
