import { renderPage } from '../renderer.js';
import { AdminLayout } from '../layouts/admin-layout.jsx';
import { SuppliersPage } from '../pages/ims/procurement/suppliers-page.jsx';
import { CreateSupplierPage } from '../pages/ims/procurement/create-supplier-page.jsx';
import { SupplierDetailPage } from '../pages/ims/procurement/supplier-detail-page.jsx';
import { PurchaseOrdersPage } from '../pages/ims/procurement/purchase-orders-page.jsx';
import { CreatePurchaseOrderPage } from '../pages/ims/procurement/create-po-page.jsx';
import { PurchaseOrderDetailPage } from '../pages/ims/procurement/po-detail-page.jsx';
import { ReceivePurchaseOrderPage } from '../pages/ims/procurement/receive-po-page.jsx';
import { unwrap, isErr } from '../../../../../lib/trust/index.js';
import { QUERY_LIMITS } from '../../../../../src/constants.js';

// Suppliers
export const listSuppliersHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const procurement = c.ctx.get('domain.procurement');
    const cursor = c.req.query('cursor');
    const q = c.req.query('q');

    const res = await procurement.repositories.supplier.query(tenantId, {
        limit: 50,
        cursor,
        filter: { search: q },
        searchFields: ['name', 'contactName', 'email']
    });
    const { items: suppliers, nextCursor } = unwrap(res);

    const html = await renderPage(SuppliersPage, {
        user,
        suppliers,
        nextCursor,
        query: q,
        activePage: 'suppliers',
        layout: AdminLayout,
        title: 'Suppliers - IMS Admin'
    });
    return c.html(html);
};

export const createSupplierPageHandler = async (c) => {
    const user = c.get('user');
    const html = await renderPage(CreateSupplierPage, {
        user,
        activePage: 'suppliers',
        layout: AdminLayout,
        title: 'New Supplier - IMS Admin'
    });
    return c.html(html);
};

export const createSupplierHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const procurement = c.ctx.get('domain.procurement');
    const body = await c.req.parseBody();

    try {
        unwrap(await procurement.useCases.createSupplier.execute(tenantId, body));
        return c.redirect('/ims/procurement/suppliers');
    } catch (e) {
        return c.text(e.message, 400);
    }
};

export const supplierDetailHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const supplierId = c.req.param('id');
    const procurement = c.ctx.get('domain.procurement');

    const res = await procurement.repositories.supplier.findById(tenantId, supplierId);
    if (isErr(res)) return c.text('Supplier not found', 404);
    const supplier = res.value;

    // Use query for POs
    const poRes = await procurement.repositories.purchaseOrder.query(tenantId, {
        limit: 100, // Should be enough for detail view list
        filter: { supplier: supplierId } // Assuming indexed? Check KVPurchaseOrderRepository.
        // Memory says: "KVPurchaseOrderRepository have been converted...". Indexes?
        // Usually supplierId is indexed.
    });
    const supplierPOs = unwrap(poRes).items;

    const html = await renderPage(SupplierDetailPage, {
        user,
        supplier,
        purchaseOrders: supplierPOs,
        activePage: 'suppliers',
        layout: AdminLayout,
        title: `${supplier.name} - IMS Admin`
    });
    return c.html(html);
};

// Purchase Orders
export const listPurchaseOrdersHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const procurement = c.ctx.get('domain.procurement');
    const cursor = c.req.query('cursor');
    const q = c.req.query('q');

    const resolvers = {
        supplier: (ids) => procurement.repositories.supplier.findByIds(tenantId, ids)
    };

    const res = await procurement.repositories.purchaseOrder.query(tenantId, {
        limit: 50,
        cursor,
        filter: { search: q },
        searchFields: ['code', 'supplierId'], // Search by PO Code
        populate: ['supplier']
    }, { resolvers });

    const { items: purchaseOrders, nextCursor } = unwrap(res);

    // Flatten supplier name
    const viewPOs = purchaseOrders.map(po => ({
        ...po,
        supplierName: po.supplier?.name || 'Unknown'
    }));

    const html = await renderPage(PurchaseOrdersPage, {
        user,
        purchaseOrders: viewPOs,
        nextCursor,
        query: q,
        activePage: 'purchase-orders',
        layout: AdminLayout,
        title: 'Purchase Orders - IMS Admin'
    });
    return c.html(html);
};

export const createPurchaseOrderPageHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const procurement = c.ctx.get('domain.procurement');
    const catalog = c.ctx.get('domain.catalog');

    // Use list instead of useCases? Or existing useCases are fine if they are simple wrappers.
    // existing useCases.listSuppliers calls repo.list.
    // But handler previously used useCases.
    const sRes = await procurement.repositories.supplier.query(tenantId, { limit: QUERY_LIMITS.INTERNAL });
    const pRes = await catalog.repositories.product.query(tenantId, { limit: QUERY_LIMITS.INTERNAL });
    const { items: suppliers } = unwrap(sRes);
    const { items: products } = unwrap(pRes);

    const html = await renderPage(CreatePurchaseOrderPage, {
        user,
        suppliers,
        products,
        activePage: 'purchase-orders',
        layout: AdminLayout,
        title: 'New Purchase Order - IMS Admin'
    });
    return c.html(html);
};

export const createPurchaseOrderHandler = async (c) => {
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
        unwrap(await procurement.useCases.createPurchaseOrder.execute(tenantId, {
            supplierId: body.supplierId,
            expectedDate: body.expectedDate ? new Date(body.expectedDate).toISOString() : undefined,
            items
        }));
        return c.redirect('/ims/procurement/purchase-orders');
    } catch (e) {
        return c.text(e.message, 400);
    }
};

export const purchaseOrderDetailHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const poId = c.req.param('id');
    const procurement = c.ctx.get('domain.procurement');
    const catalog = c.ctx.get('domain.catalog');

    const poRes = await procurement.useCases.getPurchaseOrder.execute(tenantId, poId);
    if (isErr(poRes)) return c.text('PO not found', 404);
    const po = poRes.value;

    // Populate Products manually (or via query if we fetched items via query, but items are embedded)
    // Items are in PO.items array.
    // We can use findByIds for products!
    const productIds = po.items.map(i => i.productId);
    const pRes = await catalog.repositories.product.findByIds(tenantId, productIds);
    if (!isErr(pRes)) {
        const pMap = new Map(pRes.value.map(p => [p.id, p]));
        for (const item of po.items) {
            const product = pMap.get(item.productId);
            item.productName = product ? product.name : 'Unknown';
            item.sku = product ? product.sku : '';
        }
    }

    const sRes = await procurement.repositories.supplier.findById(tenantId, po.supplierId);
    const supplier = isErr(sRes) ? null : sRes.value;
    po.supplierName = supplier ? supplier.name : 'Unknown';

    const html = await renderPage(PurchaseOrderDetailPage, {
        user,
        po,
        activePage: 'purchase-orders',
        layout: AdminLayout,
        title: `PO ${po.code} - IMS Admin`
    });
    return c.html(html);
};

export const receivePurchaseOrderPageHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const poId = c.req.param('id');
    const procurement = c.ctx.get('domain.procurement');
    const inventory = c.ctx.get('domain.inventory');
    const catalog = c.ctx.get('domain.catalog');

    const poRes = await procurement.useCases.getPurchaseOrder.execute(tenantId, poId);
    if (isErr(poRes)) return c.text('PO not found', 404);
    const po = poRes.value;

    const productIds = po.items.map(i => i.productId);
    const pRes = await catalog.repositories.product.findByIds(tenantId, productIds);
    if (!isErr(pRes)) {
        const pMap = new Map(pRes.value.map(p => [p.id, p]));
        for (const item of po.items) {
             const product = pMap.get(item.productId);
             if (product) {
                 item.productName = product.name;
                 item.sku = product.sku;
             }
        }
    }

    const lRes = await inventory.repositories.location.query(tenantId, { limit: QUERY_LIMITS.INTERNAL });
    const allLocations = unwrap(lRes).items;

    const html = await renderPage(ReceivePurchaseOrderPage, {
        user,
        po,
        locations: allLocations,
        activePage: 'purchase-orders',
        layout: AdminLayout,
        title: 'Receive PO - IMS Admin'
    });
    return c.html(html);
};

export const receivePurchaseOrderHandler = async (c) => {
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
        unwrap(await procurement.useCases.receivePurchaseOrder.execute(tenantId, poId, {
            locationId: body.locationId,
            items
        }));
        return c.redirect('/ims/procurement/purchase-orders');
    } catch (e) {
        return c.text(e.message, 400);
    }
};
