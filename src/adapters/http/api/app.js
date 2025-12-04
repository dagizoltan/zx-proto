import { Hono } from 'https://deno.land/x/hono@v3.11.7/mod.ts';
import { cors } from 'https://deno.land/x/hono@v3.11.7/middleware.ts';
import { authRoutes } from './routes/auth-routes.js';
import { productRoutes } from './routes/product-routes.js';
import { orderRoutes } from './routes/order-routes.js';

export const createAPIApp = () => {
  const api = new Hono();

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

  return api;
};
