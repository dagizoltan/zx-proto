import { Hono } from 'hono';
import { validateRequest } from '../middleware/validation-middleware.js';
import { authMiddleware } from '../middleware/auth-middleware.js';
import { roleCheckMiddleware } from '../middleware/rbac-middleware.js';
import { createBOMSchema, createWorkOrderSchema } from '../validators/manufacturing.validator.js';
import {
  listBOMsHandler,
  createBOMHandler,
  listWorkOrdersHandler,
  createWorkOrderHandler
} from '../handlers/manufacturing/index.js';

export const manufacturingRoutes = new Hono();

manufacturingRoutes.use('*', authMiddleware);
manufacturingRoutes.use('*', roleCheckMiddleware(['admin', 'manager', 'warehouse_staff']));

manufacturingRoutes.get('/boms', listBOMsHandler);
manufacturingRoutes.post('/boms', validateRequest(createBOMSchema), createBOMHandler);

manufacturingRoutes.get('/work-orders', listWorkOrdersHandler);
manufacturingRoutes.post('/work-orders', validateRequest(createWorkOrderSchema), createWorkOrderHandler);
