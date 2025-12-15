import { Hono } from 'hono';
import { listBOMsHandler } from '../../handlers/manufacturing/list-boms.handler.js';
import { createBOMPageHandler } from '../../handlers/manufacturing/create-bom-page.handler.js';
import { createBOMHandler } from '../../handlers/manufacturing/create-bom.handler.js';
import { bomDetailHandler } from '../../handlers/manufacturing/bom-detail.handler.js';
import { listWorkOrdersHandler } from '../../handlers/manufacturing/list-work-orders.handler.js';
import { createWorkOrderPageHandler } from '../../handlers/manufacturing/create-work-order-page.handler.js';
import { createWorkOrderHandler } from '../../handlers/manufacturing/create-work-order.handler.js';
import { workOrderDetailHandler } from '../../handlers/manufacturing/work-order-detail.handler.js';
import { completeWorkOrderHandler } from '../../handlers/manufacturing/complete-work-order.handler.js';

export const manufacturingRoutes = new Hono();

// BOMs
manufacturingRoutes.get('/boms', listBOMsHandler);
manufacturingRoutes.get('/boms/new', createBOMPageHandler);
manufacturingRoutes.post('/boms', createBOMHandler);
manufacturingRoutes.get('/boms/:id', bomDetailHandler);

// Work Orders
manufacturingRoutes.get('/work-orders', listWorkOrdersHandler);
manufacturingRoutes.get('/work-orders/new', createWorkOrderPageHandler);
manufacturingRoutes.post('/work-orders', createWorkOrderHandler);
manufacturingRoutes.get('/work-orders/:id', workOrderDetailHandler);
manufacturingRoutes.post('/work-orders/:id/complete', completeWorkOrderHandler);
