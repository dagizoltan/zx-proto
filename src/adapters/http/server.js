import { Hono } from 'hono';
import { createAPIApp } from './api/app.js';
import { createUIApp } from './ui/app.js';

export const createServer = (ctx) => {
  const mainApp = new Hono();

  // Attach ctx to all requests
  mainApp.use('*', async (c, next) => {
    c.ctx = ctx;
    await next();
  });

  // Global observability middleware
  mainApp.use('*', async (c, next) => {
    const start = performance.now();
    const traceId = crypto.randomUUID();
    const obs = c.ctx.get('infra.obs');

    c.set('traceId', traceId);

    // We can't log start because obs relies on await and we want to wrap next()
    // but obs.traceSpan could be used if we wrapped the whole thing.
    // For now simple log.

    await next();

    const duration = performance.now() - start;
    await obs.metric('http.request.duration', duration, {
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
    });
  });

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
