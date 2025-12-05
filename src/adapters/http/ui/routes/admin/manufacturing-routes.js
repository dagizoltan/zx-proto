import { Hono } from 'hono';
import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { BOMsPage } from '../../pages/admin/manufacturing/boms-page.jsx';
import { BOMDetailPage } from '../../pages/admin/manufacturing/bom-detail-page.jsx';
import { CreateBOMPage } from '../../pages/admin/manufacturing/create-bom-page.jsx';
import { WorkOrdersPage } from '../../pages/admin/manufacturing/work-orders-page.jsx';
import { WorkOrderDetailPage } from '../../pages/admin/manufacturing/wo-detail-page.jsx';
import { CreateWorkOrderPage } from '../../pages/admin/manufacturing/create-wo-page.jsx';
import { CompleteWorkOrderPage } from '../../pages/admin/manufacturing/complete-wo-page.jsx';

export const manufacturingRoutes = new Hono();

// BOMs
manufacturingRoutes.get('/boms', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const manufacturing = c.ctx.get('domain.manufacturing');
    const catalog = c.ctx.get('domain.catalog');

    const { items: boms } = await manufacturing.useCases.listBOMs.execute(tenantId);

    for (const bom of boms) {
        const product = await catalog.useCases.getProduct.execute(tenantId, bom.productId).catch(() => null);
        bom.productName = product ? product.name : 'Unknown Product';
    }

    const html = await renderPage(BOMsPage, {
        user,
        boms,
        activePage: 'boms',
        layout: AdminLayout,
        title: 'Bill of Materials - IMS Admin'
    });
    return c.html(html);
});

manufacturingRoutes.get('/boms/new', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const catalog = c.ctx.get('domain.catalog');

    const { items: products } = await catalog.useCases.listProducts.execute(tenantId, 1, 100);

    const html = await renderPage(CreateBOMPage, {
        user,
        products,
        activePage: 'boms',
        layout: AdminLayout,
        title: 'New BOM - IMS Admin'
    });
    return c.html(html);
});

manufacturingRoutes.post('/boms', async (c) => {
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
        await manufacturing.useCases.createBOM.execute(tenantId, {
            name: body.name,
            productId: body.productId,
            laborCost: parseFloat(body.laborCost || 0),
            components
        });
        return c.redirect('/admin/manufacturing/boms');
    } catch (e) {
        return c.text(e.message, 400);
    }
});

manufacturingRoutes.get('/boms/:id', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const bomId = c.req.param('id');
    const manufacturing = c.ctx.get('domain.manufacturing');
    const catalog = c.ctx.get('domain.catalog');

    const bom = await manufacturing.repositories.bom.findById(tenantId, bomId);
    if (!bom) return c.text('BOM not found', 404);

    const product = await catalog.useCases.getProduct.execute(tenantId, bom.productId).catch(() => null);
    bom.productName = product ? product.name : 'Unknown';

    for (const comp of bom.components) {
        const p = await catalog.useCases.getProduct.execute(tenantId, comp.productId).catch(() => null);
        comp.productName = p ? p.name : 'Unknown';
        comp.sku = p ? p.sku : '';
    }

    const html = await renderPage(BOMDetailPage, {
        user,
        bom,
        activePage: 'boms',
        layout: AdminLayout,
        title: `${bom.name} - IMS Admin`
    });
    return c.html(html);
});

// Work Orders
manufacturingRoutes.get('/work-orders', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const manufacturing = c.ctx.get('domain.manufacturing');

    const { items: workOrders } = await manufacturing.useCases.listWorkOrders.execute(tenantId);

    for (const wo of workOrders) {
        const bom = await manufacturing.repositories.bom.findById(tenantId, wo.bomId);
        if (bom) {
             wo.productName = 'Product from BOM ' + bom.name;
        }
    }

    const html = await renderPage(WorkOrdersPage, {
        user,
        workOrders,
        activePage: 'work-orders',
        layout: AdminLayout,
        title: 'Work Orders - IMS Admin'
    });
    return c.html(html);
});

manufacturingRoutes.get('/work-orders/new', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const manufacturing = c.ctx.get('domain.manufacturing');

    const { items: boms } = await manufacturing.useCases.listBOMs.execute(tenantId);

    const html = await renderPage(CreateWorkOrderPage, {
        user,
        boms,
        activePage: 'work-orders',
        layout: AdminLayout,
        title: 'New Work Order - IMS Admin'
    });
    return c.html(html);
});

manufacturingRoutes.post('/work-orders', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const manufacturing = c.ctx.get('domain.manufacturing');
    const body = await c.req.parseBody();

    try {
        await manufacturing.useCases.createWorkOrder.execute(tenantId, {
            bomId: body.bomId,
            quantity: parseInt(body.quantity),
            startDate: body.startDate ? new Date(body.startDate).toISOString() : undefined,
            code: body.code || undefined
        });
        return c.redirect('/admin/manufacturing/work-orders');
    } catch (e) {
        const { items: boms } = await manufacturing.useCases.listBOMs.execute(tenantId);

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
});

manufacturingRoutes.get('/work-orders/:id', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const woId = c.req.param('id');
    const manufacturing = c.ctx.get('domain.manufacturing');
    const catalog = c.ctx.get('domain.catalog');

    const wo = await manufacturing.repositories.workOrder.findById(tenantId, woId);
    if (!wo) return c.text('Work Order not found', 404);

    const bom = await manufacturing.repositories.bom.findById(tenantId, wo.bomId);

    if (bom) {
        const product = await catalog.useCases.getProduct.execute(tenantId, bom.productId).catch(() => null);
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
});

manufacturingRoutes.post('/work-orders/:id/complete', async (c) => {
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
            return c.redirect('/admin/manufacturing/work-orders');
        } catch (e) {
            return c.text(e.message, 400);
        }
    } else {
        // Render selection page
        const user = c.get('user');
        const inventory = c.ctx.get('domain.inventory');
        const wo = await manufacturing.repositories.workOrder.findById(tenantId, woId);

        const bom = await manufacturing.repositories.bom.findById(tenantId, wo.bomId);
        wo.productName = 'Product from ' + (bom ? bom.name : 'Unknown BOM');

        const warehouses = await inventory.repositories.warehouse.findAll(tenantId);
        let allLocations = [];
        for (const w of warehouses) {
            const locs = await inventory.repositories.location.findByWarehouseId(tenantId, w.id);
            allLocations = allLocations.concat(locs);
        }

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
});
