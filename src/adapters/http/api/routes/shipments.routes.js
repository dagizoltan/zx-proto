import { Hono } from 'hono';
import { validateRequest, validateQuery } from '../middleware/validation-middleware.js';
import { authMiddleware } from '../middleware/auth-middleware.js';
import { roleCheckMiddleware } from '../middleware/rbac-middleware.js';
import { createShipmentSchema, listShipmentsQuerySchema } from '../validators/shipments.validator.js';
import { listShipmentsHandler, createShipmentHandler } from '../handlers/shipments/index.js';

export const shipmentsRoutes = new Hono();

shipmentsRoutes.use('*', authMiddleware);
shipmentsRoutes.use('*', roleCheckMiddleware(['admin', 'manager', 'warehouse_staff']));

shipmentsRoutes.get('/', validateQuery(listShipmentsQuerySchema), listShipmentsHandler);
shipmentsRoutes.post('/', validateRequest(createShipmentSchema), createShipmentHandler);
