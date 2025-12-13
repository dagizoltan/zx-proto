import { createObs } from './obs.js';
import { createKVLogRepository } from '../../ctx/observability/infrastructure/adapters/kv-log-repository.adapter.js';
import { createKVTraceRepository } from '../persistence/kv/repositories/kv-trace-repository.js';
import { createKVMetricRepository } from '../persistence/kv/repositories/kv-metric-repository.js';

export const createObsContext = async (deps) => {
  const { config, persistence, messaging } = deps;
  const { eventBus } = messaging || {};
  const { kvPool } = persistence;
  const minLevel = config.get('observability.logLevel') || 'INFO';

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
