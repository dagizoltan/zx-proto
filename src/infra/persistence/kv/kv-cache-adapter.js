export const createCache = (kvPool) => {
  const get = async (key) => {
    return kvPool.withConnection(async (kv) => {
      const result = await kv.get(['cache', key]);
      return result.value;
    });
  };

  const set = async (key, value, ttlMs = 3600000) => {
    return kvPool.withConnection(async (kv) => {
      await kv.set(['cache', key], value, {
        expireIn: ttlMs,
      });
    });
  };

  const del = async (key) => {
    return kvPool.withConnection(async (kv) => {
      await kv.delete(['cache', key]);
    });
  };

  const memoize = (fn, keyFn, ttlMs) => {
    return async (...args) => {
      const cacheKey = keyFn(...args);
      const cached = await get(cacheKey);

      if (cached !== null) {
        return cached;
      }

      const result = await fn(...args);
      await set(cacheKey, result, ttlMs);
      return result;
    };
  };

  return { get, set, del, memoize };
};
