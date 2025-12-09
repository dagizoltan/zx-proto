import { Hono } from 'hono';
import * as handlers from '../../handlers/inventory.handlers.js';

export const inventoryRoutes = new Hono();

// Dashboard / All Products Stock
inventoryRoutes.get('/', handlers.listInventoryHandler);

// Transfer Stock
inventoryRoutes.get('/transfer', handlers.transferStockPageHandler);
inventoryRoutes.post('/transfer', handlers.transferStockHandler);

// Receive Stock
inventoryRoutes.get('/receive', handlers.receiveStockPageHandler);
inventoryRoutes.post('/receive', handlers.receiveStockHandler);

// Warehouses
inventoryRoutes.get('/warehouses', handlers.listWarehousesHandler);
inventoryRoutes.get('/warehouses/new', handlers.createWarehousePageHandler);
inventoryRoutes.post('/warehouses', handlers.createWarehouseHandler);
inventoryRoutes.get('/warehouses/:id', handlers.warehouseDetailHandler);

// Locations
inventoryRoutes.get('/locations', handlers.listLocationsHandler);
inventoryRoutes.get('/locations/new', handlers.createLocationPageHandler);
inventoryRoutes.post('/locations', handlers.createLocationHandler);
inventoryRoutes.get('/locations/:id', handlers.locationDetailHandler);
