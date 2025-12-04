import { Hono } from 'hono';
import { cors } from 'hono/middleware.ts';
import { authRoutes } from './routes/auth-routes.js';
import { productRoutes } from './routes/product-routes.js';
import { orderRoutes } from './routes/order-routes.js';
import { adminRoutes } from './routes/admin-routes.js';
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
  api.route('/products', productRoutes);
  api.route('/orders', orderRoutes);
  api.route('/admin', adminRoutes);

  return api;
};
