import { createObs } from './obs.js';
import { createKVLogRepository } from '../../ctx/observability/infrastructure/adapters/kv-log-repository.adapter.js';
import { createKVTraceRepository } from '../persistence/kv/repositories/kv-trace-repository.js';
import { createKVMetricRepository } from '../persistence/kv/repositories/kv-metric-repository.js';
import { resolveDependencies } from '../../utils/registry/dependency-resolver.js';

export const createObsContext = async (deps) => {
  const { config, kvPool, eventBus } = resolveDependencies(deps, {
    config: 'config',
    kvPool: ['persistence.kvPool', 'kvPool'],
    eventBus: ['messaging.eventBus', 'eventBus']
  });

  const minLevel = config?.get('observability.logLevel') || 'INFO';

  const logRepo = createKVLogRepository(kvPool);
  const traceRepo = createKVTraceRepository(kvPool);
  const metricRepo = createKVMetricRepository(kvPool);

  const obs = createObs({
      kvPool,
      minLevel,
      eventBus,
      repositories: {
          log: logRepo,
          trace: traceRepo,
          metric: metricRepo
      }
  });

  return obs;
};

export const ObsContext = {
    name: 'infra.obs',
    dependencies: ['infra.persistence', 'infra.messaging'],
    factory: createObsContext
};
