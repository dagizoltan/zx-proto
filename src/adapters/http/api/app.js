import { Hono } from 'hono';
import { cors } from 'hono/middleware.ts';
import { errorHandler } from '../middleware/error-handler.js';

// New Refactored Routes
import { authRoutes } from './routes/auth.routes.js';
import { catalogRoutes } from './routes/catalog.routes.js';
import { ordersRoutes } from './routes/orders.routes.js';
import { systemRoutes } from './routes/system.routes.js';
import { crmRoutes } from './routes/crm.routes.js';

// Old routes (deprecated/removed)
// import { productRoutes } from './routes/product-routes.js';
// import { orderRoutes } from './routes/order-routes.js';
// import { imsRoutes } from './routes/admin-routes.js';

export const createAPIApp = () => {
  const api = new Hono();

  api.onError(errorHandler);

  // API-specific middleware
  api.use('*', cors({
    origin: (origin) => origin, // Allow all origins, or configure from c.ctx.config
    credentials: true,
  }));

  // JSON response by default
  api.use('*', async (c, next) => {
    c.header('Content-Type', 'application/json');
    await next();
  });

  // Mount routes
  api.route('/auth', authRoutes);
  api.route('/catalogs', catalogRoutes);
  api.route('/orders', ordersRoutes);

  // System and CRM routes (formerly under /admin)
  // We mount them under /system and /crm for cleaner structure
  // or we could mount them under /admin/system and /admin/crm if we want to preserve /admin prefix logic
  // But strictly speaking, REST API should be cleaner.
  api.route('/system', systemRoutes);
  api.route('/crm', crmRoutes);

  return api;
};
