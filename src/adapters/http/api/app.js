import { Hono } from 'hono';
import { cors } from 'hono/middleware.ts';
import { errorHandler } from '../middleware/error-handler.js';

// Refactored Routes
import { authRoutes } from './routes/auth.routes.js';
import { catalogRoutes } from './routes/catalog.routes.js';
import { ordersRoutes } from './routes/orders.routes.js';
import { systemRoutes } from './routes/system.routes.js';
import { crmRoutes } from './routes/crm.routes.js';
import { inventoryRoutes } from './routes/inventory.routes.js';
import { procurementRoutes } from './routes/procurement.routes.js';
import { manufacturingRoutes } from './routes/manufacturing.routes.js';
import { shipmentsRoutes } from './routes/shipments.routes.js';

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
  api.route('/system', systemRoutes);
  api.route('/crm', crmRoutes);
  api.route('/inventory', inventoryRoutes);
  api.route('/procurement', procurementRoutes);
  api.route('/manufacturing', manufacturingRoutes);
  api.route('/shipments', shipmentsRoutes);

  return api;
};
