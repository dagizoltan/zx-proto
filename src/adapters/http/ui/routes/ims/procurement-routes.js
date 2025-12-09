import { Hono } from 'hono';
import * as handlers from '../../handlers/procurement.handlers.js';

export const procurementRoutes = new Hono();

// Suppliers
procurementRoutes.get('/suppliers', handlers.listSuppliersHandler);
procurementRoutes.get('/suppliers/new', handlers.createSupplierPageHandler);
procurementRoutes.post('/suppliers', handlers.createSupplierHandler);
procurementRoutes.get('/suppliers/:id', handlers.supplierDetailHandler);

// Purchase Orders
procurementRoutes.get('/purchase-orders', handlers.listPurchaseOrdersHandler);
procurementRoutes.get('/purchase-orders/new', handlers.createPurchaseOrderPageHandler);
procurementRoutes.post('/purchase-orders', handlers.createPurchaseOrderHandler);
procurementRoutes.get('/purchase-orders/:id', handlers.purchaseOrderDetailHandler);
procurementRoutes.get('/purchase-orders/:id/receive', handlers.receivePurchaseOrderPageHandler);
procurementRoutes.post('/purchase-orders/:id/receive', handlers.receivePurchaseOrderHandler);
