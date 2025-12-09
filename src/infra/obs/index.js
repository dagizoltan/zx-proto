import { createObs } from './obs.js';

export const createObsContext = async (deps) => {
  const { config, persistence, messaging } = deps;
  const { eventBus } = messaging || {};
  const minLevel = config.get('observability.logLevel') || 'INFO';

  const obs = createObs(persistence.kvPool, minLevel, eventBus);

  return obs;
};
