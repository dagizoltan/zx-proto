import { createKVLogRepository } from './infrastructure/adapters/kv-log-repository.adapter.js';
import { createKVActivityRepository } from './infrastructure/adapters/kv-activity-repository.adapter.js';
import { createKVAuditRepository } from './infrastructure/adapters/kv-audit-repository.adapter.js';
import { createKVTraceRepository } from './infrastructure/adapters/kv-trace-repository.adapter.js';
import { createKVMetricRepository } from './infrastructure/adapters/kv-metric-repository.adapter.js';

import { createListLogs } from './application/use-cases/list-logs.js';
import { createListActivityLogs } from './application/use-cases/list-activity-logs.js';
import { createListAuditLogs } from './application/use-cases/list-audit-logs.js';
import { createObsService } from './service/obs.service.js';

import { resolveDependencies } from '../../utils/registry/dependency-resolver.js';
import { createContextBuilder } from '../../utils/registry/context-builder.js';

export const createObservabilityContext = async (deps) => {
    const { kvPool, config, eventBus } = resolveDependencies(deps, {
        kvPool: ['persistence.kvPool', 'kvPool'],
        config: 'config',
        eventBus: ['messaging.eventBus', 'eventBus']
    });

    const minLevel = config?.get('observability.logLevel') || 'INFO';

    const logRepo = createKVLogRepository(kvPool);
    const activityRepo = createKVActivityRepository(kvPool);
    const auditRepo = createKVAuditRepository(kvPool);
    const traceRepo = createKVTraceRepository(kvPool);
    const metricRepo = createKVMetricRepository(kvPool);

    const repositories = {
        log: logRepo,
        activity: activityRepo,
        audit: auditRepo,
        trace: traceRepo,
        metric: metricRepo
    };

    const obsService = createObsService({
        repositories,
        minLevel,
        eventBus
    });

    return createContextBuilder('observability')
        .withRepositories(repositories)
        .withUseCases({
            listLogs: createListLogs({ logRepository: logRepo }),
            listActivityLogs: createListActivityLogs({ activityRepository: activityRepo }),
            listAuditLogs: createListAuditLogs({ auditRepository: auditRepo })
        })
        .withProps({
            obs: obsService
        })
        .build();
};

export const ObservabilityContext = {
    name: 'observability',
    dependencies: ['infra.persistence', 'infra.messaging'],
    factory: createObservabilityContext
};
