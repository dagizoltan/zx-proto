import { Hono } from 'hono';
import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { SuppliersPage } from '../../pages/ims/procurement/suppliers-page.jsx';
import { CreateSupplierPage } from '../../pages/ims/procurement/create-supplier-page.jsx';
import { SupplierDetailPage } from '../../pages/ims/procurement/supplier-detail-page.jsx';
import { PurchaseOrdersPage } from '../../pages/ims/procurement/purchase-orders-page.jsx';
import { CreatePurchaseOrderPage } from '../../pages/ims/procurement/create-po-page.jsx';
import { PurchaseOrderDetailPage } from '../../pages/ims/procurement/po-detail-page.jsx';
import { ReceivePurchaseOrderPage } from '../../pages/ims/procurement/receive-po-page.jsx';

export const procurementRoutes = new Hono();

// Suppliers
procurementRoutes.get('/suppliers', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const procurement = c.ctx.get('domain.procurement');

    const { items: suppliers } = await procurement.useCases.listSuppliers.execute(tenantId);

    const html = await renderPage(SuppliersPage, {
        user,
        suppliers,
        activePage: 'suppliers',
        layout: AdminLayout,
        title: 'Suppliers - IMS Admin'
    });
    return c.html(html);
});

procurementRoutes.get('/suppliers/new', async (c) => {
    const user = c.get('user');
    const html = await renderPage(CreateSupplierPage, {
        user,
        activePage: 'suppliers',
        layout: AdminLayout,
        title: 'New Supplier - IMS Admin'
    });
    return c.html(html);
});

procurementRoutes.post('/suppliers', async (c) => {
    const tenantId = c.get('tenantId');
    const procurement = c.ctx.get('domain.procurement');
    const body = await c.req.parseBody();

    try {
        await procurement.useCases.createSupplier.execute(tenantId, body);
        return c.redirect('/ims/procurement/suppliers');
    } catch (e) {
        return c.text(e.message, 400);
    }
});

procurementRoutes.get('/suppliers/:id', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const supplierId = c.req.param('id');
    const procurement = c.ctx.get('domain.procurement');

    const supplier = await procurement.repositories.supplier.findById(tenantId, supplierId);
    if (!supplier) return c.text('Supplier not found', 404);

    const { items: allPOs } = await procurement.useCases.listPurchaseOrders.execute(tenantId);
    const supplierPOs = allPOs.filter(po => po.supplierId === supplierId);

    const html = await renderPage(SupplierDetailPage, {
        user,
        supplier,
        purchaseOrders: supplierPOs,
        activePage: 'suppliers',
        layout: AdminLayout,
        title: `${supplier.name} - IMS Admin`
    });
    return c.html(html);
});

// Purchase Orders
procurementRoutes.get('/purchase-orders', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const procurement = c.ctx.get('domain.procurement');

    const { items: purchaseOrders } = await procurement.useCases.listPurchaseOrders.execute(tenantId);

    for (const po of purchaseOrders) {
        const supplier = await procurement.repositories.supplier.findById(tenantId, po.supplierId);
        po.supplierName = supplier ? supplier.name : 'Unknown';
    }

    const html = await renderPage(PurchaseOrdersPage, {
        user,
        purchaseOrders,
        activePage: 'purchase-orders',
        layout: AdminLayout,
        title: 'Purchase Orders - IMS Admin'
    });
    return c.html(html);
});

procurementRoutes.get('/purchase-orders/new', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const procurement = c.ctx.get('domain.procurement');
    const catalog = c.ctx.get('domain.catalog');

    const { items: suppliers } = await procurement.useCases.listSuppliers.execute(tenantId);
    const { items: products } = await catalog.useCases.listProducts.execute(tenantId, 1, 100);

    const html = await renderPage(CreatePurchaseOrderPage, {
        user,
        suppliers,
        products,
        activePage: 'purchase-orders',
        layout: AdminLayout,
        title: 'New Purchase Order - IMS Admin'
    });
    return c.html(html);
});

procurementRoutes.post('/purchase-orders', async (c) => {
    const tenantId = c.get('tenantId');
    const procurement = c.ctx.get('domain.procurement');
    const body = await c.req.parseBody();

    // Naive parsing
    const items = [];
    const itemKeys = Object.keys(body).filter(k => k.startsWith('items['));
    const indices = new Set(itemKeys.map(k => k.match(/items\[(\d+)\]/)[1]));

    for (const i of indices) {
        items.push({
            productId: body[`items[${i}][productId]`],
            quantity: parseInt(body[`items[${i}][quantity]`]),
            unitCost: parseFloat(body[`items[${i}][unitCost]`])
        });
    }

    try {
        await procurement.useCases.createPurchaseOrder.execute(tenantId, {
            supplierId: body.supplierId,
            expectedDate: body.expectedDate ? new Date(body.expectedDate).toISOString() : undefined,
            items
        });
        return c.redirect('/ims/procurement/purchase-orders');
    } catch (e) {
        return c.text(e.message, 400);
    }
});

procurementRoutes.get('/purchase-orders/:id', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const poId = c.req.param('id');
    const procurement = c.ctx.get('domain.procurement');
    const catalog = c.ctx.get('domain.catalog');

    const po = await procurement.useCases.getPurchaseOrder.execute(tenantId, poId);
    if (!po) return c.text('PO not found', 404);

    for (const item of po.items) {
        const product = await catalog.useCases.getProduct.execute(tenantId, item.productId).catch(() => null);
        item.productName = product ? product.name : 'Unknown';
        item.sku = product ? product.sku : '';
    }

    const supplier = await procurement.repositories.supplier.findById(tenantId, po.supplierId);
    po.supplierName = supplier ? supplier.name : 'Unknown';

    const html = await renderPage(PurchaseOrderDetailPage, {
        user,
        po,
        activePage: 'purchase-orders',
        layout: AdminLayout,
        title: `PO ${po.code} - IMS Admin`
    });
    return c.html(html);
});

procurementRoutes.get('/purchase-orders/:id/receive', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const poId = c.req.param('id');
    const procurement = c.ctx.get('domain.procurement');
    const inventory = c.ctx.get('domain.inventory');
    const catalog = c.ctx.get('domain.catalog');

    const po = await procurement.useCases.getPurchaseOrder.execute(tenantId, poId);
    if (!po) return c.text('PO not found', 404);

    for (const item of po.items) {
        const product = await catalog.useCases.getProduct.execute(tenantId, item.productId).catch(() => null);
        if (product) {
             item.productName = product.name;
             item.sku = product.sku;
        }
    }

    const warehouses = await inventory.repositories.warehouse.findAll(tenantId);
    let allLocations = [];
    for (const w of warehouses) {
        const locs = await inventory.repositories.location.findByWarehouseId(tenantId, w.id);
        allLocations = allLocations.concat(locs);
    }

    const html = await renderPage(ReceivePurchaseOrderPage, {
        user,
        po,
        locations: allLocations,
        activePage: 'purchase-orders',
        layout: AdminLayout,
        title: 'Receive PO - IMS Admin'
    });
    return c.html(html);
});

procurementRoutes.post('/purchase-orders/:id/receive', async (c) => {
    const tenantId = c.get('tenantId');
    const poId = c.req.param('id');
    const procurement = c.ctx.get('domain.procurement');
    const body = await c.req.parseBody();

    const items = [];
    const indices = new Set(Object.keys(body).filter(k => k.startsWith('items[')).map(k => k.match(/items\[(\d+)\]/)[1]));

    for (const i of indices) {
        const qty = parseInt(body[`items[${i}][quantity]`]);
        if (qty > 0) {
            items.push({
                productId: body[`items[${i}][productId]`],
                quantity: qty
            });
        }
    }

    try {
        await procurement.useCases.receivePurchaseOrder.execute(tenantId, poId, {
            locationId: body.locationId,
            items
        });
        return c.redirect('/ims/procurement/purchase-orders');
    } catch (e) {
        return c.text(e.message, 400);
    }
});
