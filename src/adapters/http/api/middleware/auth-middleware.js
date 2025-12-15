export const authMiddleware = async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid authorization header' }, 401);
  }

  const token = authHeader.substring(7);
  const security = c.ctx.get('infra.security');
  const obs = c.ctx.get('domain.observability').obs;

  try {
    const payload = await security.jwtProvider.verify(token);
    c.set('user', payload);

    await next();
  } catch (error) {
    if (obs) {
        await obs.warn('Token verification failed', {
        error: error.message,
        });
    }

    return c.json({ error: 'Invalid or expired token' }, 401);
  }
};
