import { renderPage } from '../renderer.js';
import { AdminLayout } from '../layouts/admin-layout.jsx';
import { InventoryPage } from '../pages/ims/inventory-page.jsx';
import { WarehousesPage } from '../pages/ims/inventory/warehouses-page.jsx';
import { CreateWarehousePage } from '../pages/ims/inventory/create-warehouse-page.jsx';
import { WarehouseDetailPage } from '../pages/ims/inventory/warehouse-detail-page.jsx';
import { LocationsPage } from '../pages/ims/inventory/locations-page.jsx';
import { CreateLocationPage } from '../pages/ims/inventory/create-location-page.jsx';
import { LocationDetailPage } from '../pages/ims/inventory/location-detail-page.jsx';
import { TransferStockPage } from '../pages/ims/inventory/transfer-stock-page.jsx';
import { ReceiveStockPage } from '../pages/ims/inventory/receive-stock-page.jsx';

// Dashboard / All Products Stock
export const listInventoryHandler = async (c) => {
  const user = c.get('user');
  const tenantId = c.get('tenantId');
  const inventory = c.ctx.get('domain.inventory');
  const cursor = c.req.query('cursor');
  const limit = 10;
  const { items: products, nextCursor } = await inventory.useCases.listAllProducts.execute(tenantId, { limit, cursor });

  const html = await renderPage(InventoryPage, {
    user,
    products,
    nextCursor,
    currentUrl: c.req.url,
    layout: AdminLayout,
    title: 'Inventory - IMS Admin'
  });

  return c.html(html);
};

// Transfer Stock
export const transferStockPageHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const inventory = c.ctx.get('domain.inventory');

    const { items: products } = await inventory.useCases.listAllProducts.execute(tenantId, { limit: 100 });
    const warehouses = await inventory.repositories.warehouse.findAll(tenantId);
    let allLocations = [];
    for (const w of warehouses) {
        const locs = await inventory.repositories.location.findByWarehouseId(tenantId, w.id);
        allLocations = allLocations.concat(locs);
    }

    const html = await renderPage(TransferStockPage, {
        user,
        products,
        locations: allLocations,
        layout: AdminLayout,
        title: 'Transfer Stock - IMS Admin'
    });
    return c.html(html);
};

export const transferStockHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const inventory = c.ctx.get('domain.inventory');
    const body = await c.req.parseBody();

    try {
        await inventory.useCases.moveStock.execute(tenantId, {
            productId: body.productId,
            fromLocationId: body.fromLocationId,
            toLocationId: body.toLocationId,
            quantity: parseInt(body.quantity),
            reason: body.reason
        });
        return c.redirect('/ims/inventory');
    } catch (e) {
        return c.text(e.message, 400);
    }
};

// Receive Stock
export const receiveStockPageHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const inventory = c.ctx.get('domain.inventory');

    const { items: products } = await inventory.useCases.listAllProducts.execute(tenantId, { limit: 100 });
    const warehouses = await inventory.repositories.warehouse.findAll(tenantId);
    let allLocations = [];
    for (const w of warehouses) {
        const locs = await inventory.repositories.location.findByWarehouseId(tenantId, w.id);
        allLocations = allLocations.concat(locs);
    }

    const html = await renderPage(ReceiveStockPage, {
        user,
        products,
        locations: allLocations,
        layout: AdminLayout,
        title: 'Receive Stock - IMS Admin'
    });
    return c.html(html);
};

export const receiveStockHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const inventory = c.ctx.get('domain.inventory');
    const body = await c.req.parseBody();

    try {
        // Using receiveStockRobust as noted in memory/AGENTS.md
        await inventory.useCases.receiveStockRobust.execute(tenantId, {
            productId: body.productId,
            locationId: body.locationId,
            quantity: parseInt(body.quantity),
            batchNumber: body.batchNumber,
            expiryDate: body.expiryDate ? new Date(body.expiryDate).toISOString() : undefined
        });
        return c.redirect('/ims/inventory');
    } catch (e) {
        return c.text(e.message, 400);
    }
};

// Warehouses
export const listWarehousesHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const inventory = c.ctx.get('domain.inventory');

    const warehouses = await inventory.repositories.warehouse.findAll(tenantId);

    const html = await renderPage(WarehousesPage, {
        user,
        warehouses,
        activePage: 'warehouses',
        layout: AdminLayout,
        title: 'Warehouses - IMS Admin'
    });
    return c.html(html);
};

export const createWarehousePageHandler = async (c) => {
    const user = c.get('user');

    const html = await renderPage(CreateWarehousePage, {
        user,
        activePage: 'warehouses',
        layout: AdminLayout,
        title: 'New Warehouse - IMS Admin'
    });
    return c.html(html);
};

export const createWarehouseHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const inventory = c.ctx.get('domain.inventory');
    const body = await c.req.parseBody();

    try {
        await inventory.repositories.warehouse.save(tenantId, {
            name: body.name,
            code: body.code
        });
        return c.redirect('/ims/inventory/warehouses'); // Normalized URL
    } catch (e) {
        return c.text(e.message, 400);
    }
};

export const warehouseDetailHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const wId = c.req.param('id');
    const inventory = c.ctx.get('domain.inventory');

    const warehouse = await inventory.repositories.warehouse.findById(tenantId, wId);
    if (!warehouse) return c.text('Warehouse not found', 404);

    const locations = await inventory.repositories.location.findByWarehouseId(tenantId, wId);

    const html = await renderPage(WarehouseDetailPage, {
        user,
        warehouse,
        locations,
        activePage: 'warehouses',
        layout: AdminLayout,
        title: `${warehouse.name} - IMS Admin`
    });
    return c.html(html);
};

// Locations
export const listLocationsHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const inventory = c.ctx.get('domain.inventory');

    const warehouses = await inventory.repositories.warehouse.findAll(tenantId);
    let allLocations = [];
    for (const w of warehouses) {
        const locs = await inventory.repositories.location.findByWarehouseId(tenantId, w.id);
        allLocations = allLocations.concat(locs);
    }

    const html = await renderPage(LocationsPage, {
        user,
        locations: allLocations,
        warehouses,
        activePage: 'locations',
        layout: AdminLayout,
        title: 'Locations - IMS Admin'
    });
    return c.html(html);
};

export const createLocationPageHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const inventory = c.ctx.get('domain.inventory');

    const warehouses = await inventory.repositories.warehouse.findAll(tenantId);
    let allLocations = [];
    for (const w of warehouses) {
        const locs = await inventory.repositories.location.findByWarehouseId(tenantId, w.id);
        allLocations = allLocations.concat(locs);
    }

    const html = await renderPage(CreateLocationPage, {
        user,
        warehouses,
        locations: allLocations,
        activePage: 'locations',
        layout: AdminLayout,
        title: 'New Location - IMS Admin'
    });
    return c.html(html);
};

export const createLocationHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const inventory = c.ctx.get('domain.inventory');
    const body = await c.req.parseBody();

    try {
        await inventory.repositories.location.save(tenantId, {
            code: body.code,
            type: body.type,
            warehouseId: body.warehouseId,
            parentId: body.parentId || undefined
        });
        return c.redirect('/ims/inventory/locations'); // Normalized URL
    } catch (e) {
        return c.text(e.message, 400);
    }
};

export const locationDetailHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const locId = c.req.param('id');
    const inventory = c.ctx.get('domain.inventory');

    const location = await inventory.repositories.location.findById(tenantId, locId);
    if (!location) return c.text('Location not found', 404);

    const warehouse = await inventory.repositories.warehouse.findById(tenantId, location.warehouseId);
    const parent = location.parentId ? await inventory.repositories.location.findById(tenantId, location.parentId) : null;

    const html = await renderPage(LocationDetailPage, {
        user,
        location,
        warehouse,
        parentLocation: parent,
        activePage: 'locations',
        layout: AdminLayout,
        title: `${location.code} - IMS Admin`
    });
    return c.html(html);
};
