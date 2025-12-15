import { Hono } from 'hono';
import { listOrdersHandler } from '../../handlers/order/list-orders.handler.js';
import { createOrderPageHandler } from '../../handlers/order/create-order-page.handler.js';
import { createOrderHandler } from '../../handlers/order/create-order.handler.js';
import { createOrderShipmentPageHandler } from '../../handlers/order/create-order-shipment-page.handler.js';
import { createOrderShipmentHandler } from '../../handlers/order/create-order-shipment.handler.js';
import { pickListHandler } from '../../handlers/order/pick-list.handler.js';
import { packingSlipHandler } from '../../handlers/order/packing-slip.handler.js';
import { updateOrderStatusHandler } from '../../handlers/order/update-order-status.handler.js';
import { orderDetailHandler } from '../../handlers/order/order-detail.handler.js';

export const orderRoutes = new Hono();

// List Orders
orderRoutes.get('/', listOrdersHandler);

// Create Order UI
orderRoutes.get('/new', createOrderPageHandler);

// Create Order POST
orderRoutes.post('/', createOrderHandler);

// Create Shipment UI (Linked from Order)
orderRoutes.get('/:id/shipments/new', createOrderShipmentPageHandler);
orderRoutes.post('/:id/shipments', createOrderShipmentHandler);

// Pick List
orderRoutes.get('/:id/pick-list', pickListHandler);

// Packing Slip
orderRoutes.get('/:id/packing-slip', packingSlipHandler);

// Update Status
orderRoutes.post('/:id/status', updateOrderStatusHandler);

// Order Detail
orderRoutes.get('/:id', orderDetailHandler);
