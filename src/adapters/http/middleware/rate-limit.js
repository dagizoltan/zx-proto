import { LRUCache } from "https://esm.sh/lru-cache@10.2.0";

const globalCache = new LRUCache({
  max: 10000,
  ttl: 60 * 1000, // 1 minute
});

export const rateLimitMiddleware = (limit = 100, windowMs = 60000) => {
  // We can use separate caches per middleware instance or a global one.
  // For simplicity, let's use the global one but partition by path if needed,
  // or just use a new cache per middleware usage.

  const cache = new LRUCache({
    max: 10000,
    ttl: windowMs,
  });

  return async (c, next) => {
    // Identify client by IP (x-forwarded-for) or some other identifier
    const ip = c.req.header('x-forwarded-for') || 'unknown-ip';
    const key = `${ip}:${c.req.path}`;

    const count = (cache.get(key) || 0) + 1;
    cache.set(key, count);

    if (count > limit) {
      // Too Many Requests
      return c.json({ error: 'Rate limit exceeded. Please try again later.' }, 429);
    }

    await next();
  };
};
