import { renderPage } from '../renderer.js';
import { AdminLayout } from '../layouts/admin-layout.jsx';
import { BOMsPage } from '../pages/ims/manufacturing/boms-page.jsx';
import { BOMDetailPage } from '../pages/ims/manufacturing/bom-detail-page.jsx';
import { CreateBOMPage } from '../pages/ims/manufacturing/create-bom-page.jsx';
import { WorkOrdersPage } from '../pages/ims/manufacturing/work-orders-page.jsx';
import { WorkOrderDetailPage } from '../pages/ims/manufacturing/wo-detail-page.jsx';
import { CreateWorkOrderPage } from '../pages/ims/manufacturing/create-wo-page.jsx';
import { CompleteWorkOrderPage } from '../pages/ims/manufacturing/complete-wo-page.jsx';
import { unwrap, isErr } from '../../../../../lib/trust/index.js';

// BOMs
export const listBOMsHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const manufacturing = c.ctx.get('domain.manufacturing');
    const catalog = c.ctx.get('domain.catalog');
    const cursor = c.req.query('cursor');
    const q = c.req.query('q');

    const resolvers = {
        product: (ids) => catalog.repositories.product.findByIds(tenantId, ids)
    };

    const res = await manufacturing.repositories.bom.query(tenantId, {
        limit: 50,
        cursor,
        filter: { search: q },
        searchFields: ['name'],
        populate: ['product']
    }, { resolvers });

    const { items: boms, nextCursor } = unwrap(res);

    const viewBoms = boms.map(bom => ({
        ...bom,
        productName: bom.product ? bom.product.name : 'Unknown Product'
    }));

    const html = await renderPage(BOMsPage, {
        user,
        boms: viewBoms,
        nextCursor,
        query: q,
        activePage: 'boms',
        layout: AdminLayout,
        title: 'Bill of Materials - IMS Admin'
    });
    return c.html(html);
};

export const createBOMPageHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const catalog = c.ctx.get('domain.catalog');

    const res = await catalog.useCases.listProducts.execute(tenantId, { limit: 100 });
    const { items: products } = unwrap(res);

    const html = await renderPage(CreateBOMPage, {
        user,
        products,
        activePage: 'boms',
        layout: AdminLayout,
        title: 'New BOM - IMS Admin'
    });
    return c.html(html);
};

export const createBOMHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const manufacturing = c.ctx.get('domain.manufacturing');
    const body = await c.req.parseBody();

    const components = [];
    const indices = new Set(Object.keys(body).filter(k => k.startsWith('components[')).map(k => k.match(/components\[(\d+)\]/)[1]));

    for (const i of indices) {
        components.push({
            productId: body[`components[${i}][productId]`],
            quantity: parseInt(body[`components[${i}][quantity]`])
        });
    }

    try {
        unwrap(await manufacturing.useCases.createBOM.execute(tenantId, {
            name: body.name,
            productId: body.productId,
            laborCost: parseFloat(body.laborCost || 0),
            components
        }));
        return c.redirect('/ims/manufacturing/boms');
    } catch (e) {
        return c.text(e.message, 400);
    }
};

export const bomDetailHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const bomId = c.req.param('id');
    const manufacturing = c.ctx.get('domain.manufacturing');
    const catalog = c.ctx.get('domain.catalog');

    const res = await manufacturing.repositories.bom.findById(tenantId, bomId);
    if (isErr(res)) return c.text('BOM not found', 404);
    const bom = res.value;

    const pRes = await catalog.useCases.getProduct.execute(tenantId, bom.productId);
    const product = isErr(pRes) ? null : pRes.value;
    bom.productName = product ? product.name : 'Unknown';

    // Batch fetch components
    const compIds = bom.components.map(c => c.productId);
    const cRes = await catalog.repositories.product.findByIds(tenantId, compIds);
    if (!isErr(cRes)) {
        const pMap = new Map(cRes.value.map(p => [p.id, p]));
        for (const comp of bom.components) {
            const p = pMap.get(comp.productId);
            comp.productName = p ? p.name : 'Unknown';
            comp.sku = p ? p.sku : '';
        }
    }

    const html = await renderPage(BOMDetailPage, {
        user,
        bom,
        activePage: 'boms',
        layout: AdminLayout,
        title: `${bom.name} - IMS Admin`
    });
    return c.html(html);
};

// Work Orders
export const listWorkOrdersHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const manufacturing = c.ctx.get('domain.manufacturing');
    const cursor = c.req.query('cursor');
    const q = c.req.query('q');

    const resolvers = {
        bom: (ids) => manufacturing.repositories.bom.findByIds(tenantId, ids)
    };

    const res = await manufacturing.repositories.workOrder.query(tenantId, {
        limit: 50,
        cursor,
        filter: { search: q },
        searchFields: ['code'],
        populate: ['bom']
    }, { resolvers });

    const { items: workOrders, nextCursor } = unwrap(res);

    const viewOrders = workOrders.map(wo => ({
        ...wo,
        productName: wo.bom ? 'Product from BOM ' + wo.bom.name : 'Unknown'
    }));

    const html = await renderPage(WorkOrdersPage, {
        user,
        workOrders: viewOrders,
        nextCursor,
        query: q,
        activePage: 'work-orders',
        layout: AdminLayout,
        title: 'Work Orders - IMS Admin'
    });
    return c.html(html);
};

export const createWorkOrderPageHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const manufacturing = c.ctx.get('domain.manufacturing');

    const res = await manufacturing.useCases.listBOMs.execute(tenantId);
    const { items: boms } = unwrap(res);

    const html = await renderPage(CreateWorkOrderPage, {
        user,
        boms,
        activePage: 'work-orders',
        layout: AdminLayout,
        title: 'New Work Order - IMS Admin'
    });
    return c.html(html);
};

export const createWorkOrderHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const manufacturing = c.ctx.get('domain.manufacturing');
    const body = await c.req.parseBody();

    try {
        unwrap(await manufacturing.useCases.createWorkOrder.execute(tenantId, {
            bomId: body.bomId,
            quantity: parseInt(body.quantity),
            startDate: body.startDate ? new Date(body.startDate).toISOString() : undefined,
            code: body.code || undefined
        }));
        return c.redirect('/ims/manufacturing/work-orders');
    } catch (e) {
        const res = await manufacturing.useCases.listBOMs.execute(tenantId);
        const { items: boms } = unwrap(res);

        const html = await renderPage(CreateWorkOrderPage, {
            user,
            boms,
            activePage: 'work-orders',
            layout: AdminLayout,
            title: 'New Work Order - IMS Admin',
            error: e.message,
            values: body
        });
        return c.html(html, 400);
    }
};

export const workOrderDetailHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const woId = c.req.param('id');
    const manufacturing = c.ctx.get('domain.manufacturing');
    const catalog = c.ctx.get('domain.catalog');

    const woRes = await manufacturing.repositories.workOrder.findById(tenantId, woId);
    if (isErr(woRes)) return c.text('Work Order not found', 404);
    const wo = woRes.value;

    const bRes = await manufacturing.repositories.bom.findById(tenantId, wo.bomId);
    const bom = isErr(bRes) ? null : bRes.value;

    if (bom) {
        const pRes = await catalog.useCases.getProduct.execute(tenantId, bom.productId);
        const product = isErr(pRes) ? null : pRes.value;
        wo.productName = product ? product.name : 'Unknown';
    } else {
        wo.productName = 'Unknown Product';
    }

    const html = await renderPage(WorkOrderDetailPage, {
        user,
        wo,
        bom,
        activePage: 'work-orders',
        layout: AdminLayout,
        title: `${wo.code} - IMS Admin`
    });
    return c.html(html);
};

export const completeWorkOrderHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const woId = c.req.param('id');
    const manufacturing = c.ctx.get('domain.manufacturing');
    const body = await c.req.parseBody();

    // If locationId is present, execute completion
    if (body.locationId) {
        try {
            await manufacturing.useCases.completeWorkOrder.execute(tenantId, woId, {
                locationId: body.locationId,
                // Add input location support
                inputLocationId: body.inputLocationId || undefined
            });
            return c.redirect('/ims/manufacturing/work-orders');
        } catch (e) {
            return c.text(e.message, 400);
        }
    } else {
        // Render selection page
        const user = c.get('user');
        const inventory = c.ctx.get('domain.inventory');
        const woRes = await manufacturing.repositories.workOrder.findById(tenantId, woId);
        if (isErr(woRes)) return c.text('WO not found', 404);
        const wo = woRes.value;

        const bRes = await manufacturing.repositories.bom.findById(tenantId, wo.bomId);
        const bom = isErr(bRes) ? null : bRes.value;
        wo.productName = 'Product from ' + (bom ? bom.name : 'Unknown BOM');

        // Use query for locations
        const wRes = await inventory.repositories.warehouse.list(tenantId, { limit: 100 });
        const warehouses = unwrap(wRes).items;

        const lRes = await inventory.repositories.location.query(tenantId, { limit: c.ctx.get('config').get('query.limits.internal') });
        const allLocations = unwrap(lRes).items;

        const html = await renderPage(CompleteWorkOrderPage, {
            user,
            wo,
            locations: allLocations,
            activePage: 'work-orders',
            layout: AdminLayout,
            title: 'Complete Work Order - IMS Admin'
        });
        return c.html(html);
    }
};
