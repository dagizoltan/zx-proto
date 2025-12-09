import { Hono } from 'hono';
import * as handlers from '../../handlers/order.handlers.js';

export const orderRoutes = new Hono();

// List Orders
orderRoutes.get('/', handlers.listOrdersHandler);

// Create Order UI
orderRoutes.get('/new', handlers.createOrderPageHandler);

// Create Order POST
orderRoutes.post('/', handlers.createOrderHandler);

// Create Shipment UI (Linked from Order)
orderRoutes.get('/:id/shipments/new', handlers.createOrderShipmentPageHandler);
orderRoutes.post('/:id/shipments', handlers.createOrderShipmentHandler);

// Pick List
orderRoutes.get('/:id/pick-list', handlers.pickListHandler);

// Packing Slip
orderRoutes.get('/:id/packing-slip', handlers.packingSlipHandler);

// Update Status
orderRoutes.post('/:id/status', handlers.updateOrderStatusHandler);

// Order Detail
orderRoutes.get('/:id', handlers.orderDetailHandler);
