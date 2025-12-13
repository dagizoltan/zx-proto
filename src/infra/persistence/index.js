import { createKVPool } from './kv/kv-connection-pool.js';
import { createCache } from './kv/kv-cache-adapter.js';

export const createPersistenceContext = async (deps) => {
  const { config } = deps;
  const poolSize = config.get('database.kv.poolSize') || 5;
  const dbPath = config.get('database.kv.path'); // Optional path

  const kvPool = createKVPool(poolSize);
  await kvPool.initialize(dbPath);

  const cache = createCache(kvPool);

  return {
    kvPool,
    cache,
    shutdown: async () => {
      await kvPool.close();
    }
  };
};
