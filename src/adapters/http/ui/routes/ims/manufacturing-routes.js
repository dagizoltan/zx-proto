import { Hono } from 'hono';
import * as handlers from '../../handlers/manufacturing.handlers.js';

export const manufacturingRoutes = new Hono();

// BOMs
manufacturingRoutes.get('/boms', handlers.listBOMsHandler);
manufacturingRoutes.get('/boms/new', handlers.createBOMPageHandler);
manufacturingRoutes.post('/boms', handlers.createBOMHandler);
manufacturingRoutes.get('/boms/:id', handlers.bomDetailHandler);

// Work Orders
manufacturingRoutes.get('/work-orders', handlers.listWorkOrdersHandler);
manufacturingRoutes.get('/work-orders/new', handlers.createWorkOrderPageHandler);
manufacturingRoutes.post('/work-orders', handlers.createWorkOrderHandler);
manufacturingRoutes.get('/work-orders/:id', handlers.workOrderDetailHandler);
manufacturingRoutes.post('/work-orders/:id/complete', handlers.completeWorkOrderHandler);
