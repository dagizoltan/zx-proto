import { Hono } from 'hono';
import { validateRequest } from '../middleware/validation-middleware.js';
import { authMiddleware } from '../middleware/auth-middleware.js';
import { roleCheckMiddleware } from '../middleware/rbac-middleware.js';
import { createSupplierSchema, createPOSchema } from '../validators/procurement.validator.js';
import {
  listSuppliersHandler,
  createSupplierHandler,
  listPurchaseOrdersHandler,
  createPurchaseOrderHandler
} from '../handlers/procurement/index.js';

export const procurementRoutes = new Hono();

procurementRoutes.use('*', authMiddleware);
procurementRoutes.use('*', roleCheckMiddleware(['admin', 'manager']));

procurementRoutes.get('/suppliers', listSuppliersHandler);
procurementRoutes.post('/suppliers', validateRequest(createSupplierSchema), createSupplierHandler);

procurementRoutes.get('/purchase-orders', listPurchaseOrdersHandler);
procurementRoutes.post('/purchase-orders', validateRequest(createPOSchema), createPurchaseOrderHandler);
