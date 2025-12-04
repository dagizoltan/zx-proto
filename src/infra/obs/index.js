import { createObs } from './obs.js';

export const createObsContext = async (deps) => {
  const { config, persistence } = deps;
  const minLevel = config.get('observability.logLevel') || 'INFO';

  const obs = createObs(persistence.kvPool, minLevel);

  return obs;
};
