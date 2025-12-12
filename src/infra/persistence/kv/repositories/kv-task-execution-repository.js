import { createRepository, useSchema, useIndexing } from '../../../../../lib/trust/index.js';
import { TaskExecutionSchema } from '../../../../ctx/scheduler/domain/schemas/scheduler.schema.js';

export const createKVTaskExecutionRepository = (kvPool) => {
    return createRepository(kvPool, 'task_executions', [
        useSchema(TaskExecutionSchema),
        useIndexing({
            'task': (e) => e.taskId,
            'status': (e) => e.status,
            'timestamp_desc': (e) => e.startedAt
        })
    ]);
};
