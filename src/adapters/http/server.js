import { Hono } from 'hono';
import { createAPIApp } from './api/app.js';
import { createUIApp } from './ui/app.js';
import { tenantMiddleware } from './middleware/tenant-middleware.js';
import { rateLimitMiddleware } from './middleware/rate-limit.js';

export const createServer = (ctx) => {
  const mainApp = new Hono();

  // Attach ctx to all requests
  mainApp.use('*', async (c, next) => {
    c.ctx = ctx;
    await next();
  });

  // Tenant Middleware
  mainApp.use('*', tenantMiddleware);

  // Global observability middleware (Distributed Tracing)
  mainApp.use('*', async (c, next) => {
    const start = performance.now();

    // Fix #10: Distributed Tracing propagation
    const traceId = c.req.header('x-trace-id') || crypto.randomUUID();
    const obs = c.ctx.get('infra.obs');

    c.set('traceId', traceId);
    c.header('x-trace-id', traceId); // Echo back

    await next();

    const duration = performance.now() - start;
    await obs.metric('http.request.duration', duration, {
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
    });
  });

  // Fix #9: Rate Limiting for Login
  mainApp.use('/api/auth/login', rateLimitMiddleware(5, 60000)); // 5 attempts per minute

  // Mount API app at /api
  const apiApp = createAPIApp();
  mainApp.route('/api', apiApp);

  // Mount UI app at root
  const uiApp = createUIApp();
  mainApp.route('/', uiApp);

  // Health check
  mainApp.get('/health', (c) => {
    return c.json({
      status: 'healthy',
      environment: c.ctx.config.environment,
      timestamp: new Date().toISOString(),
    });
  });

  return mainApp;
};
