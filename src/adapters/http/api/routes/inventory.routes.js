import { Hono } from 'hono';
import { validateRequest } from '../middleware/validation-middleware.js';
import { authMiddleware } from '../middleware/auth-middleware.js';
import { roleCheckMiddleware } from '../middleware/rbac-middleware.js';
import {
  createWarehouseSchema,
  createLocationSchema,
  receiveStockSchema,
  moveStockSchema
} from '../validators/inventory.validator.js';
import {
  listWarehousesHandler,
  createWarehouseHandler,
  listLocationsHandler,
  createLocationHandler,
  receiveStockHandler,
  moveStockHandler
} from '../handlers/inventory/index.js';

export const inventoryRoutes = new Hono();

inventoryRoutes.use('*', authMiddleware);
inventoryRoutes.use('*', roleCheckMiddleware(['admin', 'manager', 'warehouse_staff']));

// Warehouses
inventoryRoutes.get('/warehouses', listWarehousesHandler);
inventoryRoutes.post('/warehouses', validateRequest(createWarehouseSchema), createWarehouseHandler);

// Locations
inventoryRoutes.get('/locations', listLocationsHandler);
inventoryRoutes.post('/locations', validateRequest(createLocationSchema), createLocationHandler);

// Stock Actions
inventoryRoutes.post('/receive', validateRequest(receiveStockSchema), receiveStockHandler);
inventoryRoutes.post('/move', validateRequest(moveStockSchema), moveStockHandler);
