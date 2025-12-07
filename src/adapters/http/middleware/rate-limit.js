import { LRUCache } from "lru-cache";

const cache = new LRUCache({ max: 10000, ttl: 60000 }); // 1 min window

export const rateLimitMiddleware = (maxRequests = 100) => {
  return async (c, next) => {
    // In Deno/Hono, headers might be lowercase
    const ip = c.req.header('x-forwarded-for') || 'unknown';
    const key = `${ip}:${c.req.path}`;

    const count = (cache.get(key) || 0) + 1;
    cache.set(key, count);

    if (count > maxRequests) {
      return c.json({ error: 'Rate limit exceeded' }, 429);
    }

    await next();
  };
};
