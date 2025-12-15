import { Hono } from 'hono';
import { listSuppliersHandler } from '../../handlers/procurement/list-suppliers.handler.js';
import { createSupplierPageHandler } from '../../handlers/procurement/create-supplier-page.handler.js';
import { createSupplierHandler } from '../../handlers/procurement/create-supplier.handler.js';
import { supplierDetailHandler } from '../../handlers/procurement/supplier-detail.handler.js';
import { listPurchaseOrdersHandler } from '../../handlers/procurement/list-purchase-orders.handler.js';
import { createPurchaseOrderPageHandler } from '../../handlers/procurement/create-purchase-order-page.handler.js';
import { createPurchaseOrderHandler } from '../../handlers/procurement/create-purchase-order.handler.js';
import { purchaseOrderDetailHandler } from '../../handlers/procurement/purchase-order-detail.handler.js';
import { receivePurchaseOrderPageHandler } from '../../handlers/procurement/receive-purchase-order-page.handler.js';
import { receivePurchaseOrderHandler } from '../../handlers/procurement/receive-purchase-order.handler.js';

export const procurementRoutes = new Hono();

// Suppliers
procurementRoutes.get('/suppliers', listSuppliersHandler);
procurementRoutes.get('/suppliers/new', createSupplierPageHandler);
procurementRoutes.post('/suppliers', createSupplierHandler);
procurementRoutes.get('/suppliers/:id', supplierDetailHandler);

// Purchase Orders
procurementRoutes.get('/purchase-orders', listPurchaseOrdersHandler);
procurementRoutes.get('/purchase-orders/new', createPurchaseOrderPageHandler);
procurementRoutes.post('/purchase-orders', createPurchaseOrderHandler);
procurementRoutes.get('/purchase-orders/:id', purchaseOrderDetailHandler);
procurementRoutes.get('/purchase-orders/:id/receive', receivePurchaseOrderPageHandler);
procurementRoutes.post('/purchase-orders/:id/receive', receivePurchaseOrderHandler);
