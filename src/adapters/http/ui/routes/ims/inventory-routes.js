import { Hono } from 'hono';
import { listInventoryHandler } from '../../handlers/inventory/list-inventory.handler.js';
import { transferStockPageHandler } from '../../handlers/inventory/transfer-stock-page.handler.js';
import { transferStockHandler } from '../../handlers/inventory/transfer-stock.handler.js';
import { receiveStockPageHandler } from '../../handlers/inventory/receive-stock-page.handler.js';
import { receiveStockHandler } from '../../handlers/inventory/receive-stock.handler.js';
import { listWarehousesHandler } from '../../handlers/inventory/list-warehouses.handler.js';
import { createWarehousePageHandler } from '../../handlers/inventory/create-warehouse-page.handler.js';
import { createWarehouseHandler } from '../../handlers/inventory/create-warehouse.handler.js';
import { warehouseDetailHandler } from '../../handlers/inventory/warehouse-detail.handler.js';
import { listLocationsHandler } from '../../handlers/inventory/list-locations.handler.js';
import { createLocationPageHandler } from '../../handlers/inventory/create-location-page.handler.js';
import { createLocationHandler } from '../../handlers/inventory/create-location.handler.js';
import { locationDetailHandler } from '../../handlers/inventory/location-detail.handler.js';
import { listStockMovementsHandler } from '../../handlers/inventory/list-stock-movements.handler.js';

export const inventoryRoutes = new Hono();

// Dashboard / All Products Stock
inventoryRoutes.get('/', listInventoryHandler);

// Transfer Stock
inventoryRoutes.get('/transfer', transferStockPageHandler);
inventoryRoutes.post('/transfer', transferStockHandler);

// Receive Stock
inventoryRoutes.get('/receive', receiveStockPageHandler);
inventoryRoutes.post('/receive', receiveStockHandler);

// Stock Movements
inventoryRoutes.get('/movements', listStockMovementsHandler);

// Warehouses
inventoryRoutes.get('/warehouses', listWarehousesHandler);
inventoryRoutes.get('/warehouses/new', createWarehousePageHandler);
inventoryRoutes.post('/warehouses', createWarehouseHandler);
inventoryRoutes.get('/warehouses/:id', warehouseDetailHandler);

// Locations
inventoryRoutes.get('/locations', listLocationsHandler);
inventoryRoutes.get('/locations/new', createLocationPageHandler);
inventoryRoutes.post('/locations', createLocationHandler);
inventoryRoutes.get('/locations/:id', locationDetailHandler);
