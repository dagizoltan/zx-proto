import { Hono } from 'hono';
import { cors } from 'hono/middleware.ts';
import { authRoutes } from './routes/auth-routes.js';
// import { productRoutes } from './routes/product-routes.js'; // Deprecated
import { catalogRoutes } from './routes/catalog.routes.js';
import { orderRoutes } from './routes/order-routes.js';
import { imsRoutes } from './routes/admin-routes.js';
import { errorHandler } from '../middleware/error-handler.js';

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

  // Replaced /products with /catalogs/products structure
  // Note: Old clients using /products will break.
  // If backward compatibility is needed, we could alias it.
  // For now, adhering to the plan to refactor.
  api.route('/catalogs', catalogRoutes);

  api.route('/orders', orderRoutes);
  api.route('/admin', imsRoutes);

  return api;
};
