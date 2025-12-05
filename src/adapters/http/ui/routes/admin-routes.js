import { Hono } from 'hono';
import { renderPage } from '../renderer.js';
import { DashboardPage } from '../pages/admin/dashboard-page.jsx';
import { InventoryPage } from '../pages/admin/inventory-page.jsx';
import { OrderDetailPage } from '../pages/admin/order-detail-page.jsx';
import { ProductDetailPage } from '../pages/admin/product-detail-page.jsx';
import { OrdersPage } from '../pages/admin/orders-page.jsx';
import { UsersPage } from '../pages/admin/users-page.jsx';
import { RolesPage } from '../pages/admin/roles-page.jsx';
import { CreateRolePage } from '../pages/admin/create-role-page.jsx';
import { RoleDetailPage } from '../pages/admin/role-detail-page.jsx';
import { UserDetailPage } from '../pages/admin/user-detail-page.jsx';
import { CreateUserPage } from '../pages/admin/create-user-page.jsx';
import { CustomersPage } from '../pages/admin/customers-page.jsx';
import { CreateCustomerPage } from '../pages/admin/create-customer-page.jsx';
import { CustomerDetailPage } from '../pages/admin/customer-detail-page.jsx';
import { CreateOrderPage } from '../pages/admin/create-order-page.jsx';
import { SuppliersPage } from '../pages/admin/procurement/suppliers-page.jsx';
import { CreateSupplierPage } from '../pages/admin/procurement/create-supplier-page.jsx';
import { SupplierDetailPage } from '../pages/admin/procurement/supplier-detail-page.jsx';
import { PurchaseOrdersPage } from '../pages/admin/procurement/purchase-orders-page.jsx';
import { PurchaseOrderDetailPage } from '../pages/admin/procurement/po-detail-page.jsx';
import { CreatePurchaseOrderPage } from '../pages/admin/procurement/create-po-page.jsx';
import { ReceivePurchaseOrderPage } from '../pages/admin/procurement/receive-po-page.jsx';
import { BOMsPage } from '../pages/admin/manufacturing/boms-page.jsx';
import { BOMDetailPage } from '../pages/admin/manufacturing/bom-detail-page.jsx';
import { CreateBOMPage } from '../pages/admin/manufacturing/create-bom-page.jsx';
import { WorkOrdersPage } from '../pages/admin/manufacturing/work-orders-page.jsx';
import { WorkOrderDetailPage } from '../pages/admin/manufacturing/wo-detail-page.jsx';
import { CreateWorkOrderPage } from '../pages/admin/manufacturing/create-wo-page.jsx';
import { CompleteWorkOrderPage } from '../pages/admin/manufacturing/complete-wo-page.jsx';
import { CatalogPage } from '../pages/admin/catalog/catalog-page.jsx';
import { CreateProductPage } from '../pages/admin/catalog/create-product-page.jsx';
import { CategoriesPage } from '../pages/admin/catalog/categories-page.jsx';
import { CreateCategoryPage } from '../pages/admin/catalog/create-category-page.jsx';
import { CategoryDetailPage } from '../pages/admin/catalog/category-detail-page.jsx';
import { PriceListsPage } from '../pages/admin/catalog/price-lists-page.jsx';
import { CreatePriceListPage } from '../pages/admin/catalog/create-price-list-page.jsx';
import { PriceListDetailPage } from '../pages/admin/catalog/price-list-detail-page.jsx';
import { WarehousesPage } from '../pages/admin/inventory/warehouses-page.jsx';
import { CreateWarehousePage } from '../pages/admin/inventory/create-warehouse-page.jsx';
import { WarehouseDetailPage } from '../pages/admin/inventory/warehouse-detail-page.jsx';
import { LocationsPage } from '../pages/admin/inventory/locations-page.jsx';
import { CreateLocationPage } from '../pages/admin/inventory/create-location-page.jsx';
import { LocationDetailPage } from '../pages/admin/inventory/location-detail-page.jsx';
import { PickListPage } from '../pages/admin/pick-list-page.jsx';
import { PackingSlipPage } from '../pages/admin/packing-slip-page.jsx';
import { CreateShipmentPage } from '../pages/admin/shipments/create-shipment-page.jsx';
import { ShipmentDetailPage } from '../pages/admin/shipments/shipment-detail-page.jsx';
import { ShipmentsPage } from '../pages/admin/shipments/shipments-page.jsx'; // NEW
import { AdminLayout } from '../layouts/admin-layout.jsx';
import { authMiddleware } from '../middleware/auth-middleware.js';

export const adminRoutes = new Hono();

// Protect all admin routes
adminRoutes.use('*', authMiddleware);

adminRoutes.get('/dashboard', async (c) => {
  const user = c.get('user');
  const tenantId = c.get('tenantId');
  const orders = c.ctx.get('domain.orders');

  const stats = await orders.useCases.getDashboardStats.execute(tenantId);
  const { items: recentOrders } = await orders.useCases.listOrders.execute(tenantId, { limit: 5 });

  const html = await renderPage(DashboardPage, {
    user,
    stats,
    orders: recentOrders,
    layout: AdminLayout,
    title: 'Dashboard - IMS Admin'
  });

  return c.html(html);
});

// Catalog Routes
adminRoutes.get('/catalog', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const catalog = c.ctx.get('domain.catalog');
    const page = parseInt(c.req.query('page') || '1');
    const query = c.req.query('q');

    let products;
    if (query) {
        products = await catalog.useCases.searchProducts.execute(tenantId, query);
    } else {
        products = await catalog.useCases.listProducts.execute(tenantId, page, 50);
    }

    const html = await renderPage(CatalogPage, {
        user,
        products,
        query,
        activePage: 'catalog',
        layout: AdminLayout,
        title: 'Catalog - IMS Admin'
    });
    return c.html(html);
});

adminRoutes.get('/locations/new', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const inventory = c.ctx.get('domain.inventory');

    const warehouses = await inventory.repositories.warehouse.findAll(tenantId);
    // Fetch all locations for parent selection (naive)
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
});

adminRoutes.post('/locations', async (c) => {
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
        return c.redirect('/admin/locations');
    } catch (e) {
        return c.text(e.message, 400);
    }
});

adminRoutes.get('/locations/:id', async (c) => {
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
});

adminRoutes.get('/warehouses/new', async (c) => {
    const user = c.get('user');

    const html = await renderPage(CreateWarehousePage, {
        user,
        activePage: 'warehouses',
        layout: AdminLayout,
        title: 'New Warehouse - IMS Admin'
    });
    return c.html(html);
});

adminRoutes.post('/warehouses', async (c) => {
    const tenantId = c.get('tenantId');
    const inventory = c.ctx.get('domain.inventory');
    const body = await c.req.parseBody();

    try {
        await inventory.repositories.warehouse.save(tenantId, {
            name: body.name,
            code: body.code
        });
        return c.redirect('/admin/warehouses');
    } catch (e) {
        return c.text(e.message, 400);
    }
});

adminRoutes.get('/warehouses/:id', async (c) => {
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
});

adminRoutes.get('/products/new', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const catalog = c.ctx.get('domain.catalog');

    const { items: categories } = await catalog.useCases.listCategories.execute(tenantId, { limit: 100 });
    const { items: priceLists } = await catalog.useCases.listPriceLists.execute(tenantId, { limit: 100 });

    const html = await renderPage(CreateProductPage, {
        user,
        categories,
        priceLists,
        activePage: 'catalog',
        layout: AdminLayout,
        title: 'Create Product - IMS Admin'
    });
    return c.html(html);
});

adminRoutes.post('/products', async (c) => {
    const tenantId = c.get('tenantId');
    const catalog = c.ctx.get('domain.catalog');
    const body = await c.req.parseBody();

    try {
        await catalog.useCases.createProduct.execute(tenantId, {
            name: body.name,
            sku: body.sku,
            description: body.description,
            price: parseFloat(body.price),
            costPrice: body.costPrice ? parseFloat(body.costPrice) : undefined,
            categoryId: body.categoryId || undefined,
            type: body.type
        });
        return c.redirect('/admin/catalog');
    } catch (e) {
        return c.text(e.message, 400);
    }
});

// Categories
adminRoutes.get('/categories', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const catalog = c.ctx.get('domain.catalog');
    const cursor = c.req.query('cursor');

    const { items: categories, nextCursor } = await catalog.useCases.listCategories.execute(tenantId, { limit: 50, cursor });

    const html = await renderPage(CategoriesPage, {
        user,
        categories,
        nextCursor,
        activePage: 'categories',
        layout: AdminLayout,
        title: 'Categories - IMS Admin'
    });
    return c.html(html);
});

adminRoutes.get('/categories/new', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const catalog = c.ctx.get('domain.catalog');

    const { items: categories } = await catalog.useCases.listCategories.execute(tenantId, { limit: 100 });

    const html = await renderPage(CreateCategoryPage, {
        user,
        categories,
        activePage: 'categories',
        layout: AdminLayout,
        title: 'New Category - IMS Admin'
    });
    return c.html(html);
});

adminRoutes.post('/categories', async (c) => {
    const tenantId = c.get('tenantId');
    const catalog = c.ctx.get('domain.catalog');
    const body = await c.req.parseBody();

    try {
        await catalog.useCases.createCategory.execute(tenantId, {
            name: body.name,
            description: body.description,
            parentId: body.parentId || undefined
        });
        return c.redirect('/admin/categories');
    } catch (e) {
        return c.text(e.message, 400);
    }
});

adminRoutes.get('/categories/:id', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const categoryId = c.req.param('id');
    const catalog = c.ctx.get('domain.catalog');

    // Currently we rely on listCategories to find the category or assume getCategory exists?
    // Let's assume listCategories for now or see if repo has findById.
    // Domain usually exposes getCategory useCase or we use repo.
    const category = await catalog.repositories.category.findById(tenantId, categoryId);
    if (!category) return c.text('Category not found', 404);

    const { items: allCats } = await catalog.useCases.listCategories.execute(tenantId, { limit: 100 });
    const subCategories = allCats.filter(cat => cat.parentId === categoryId);

    const html = await renderPage(CategoryDetailPage, {
        user,
        category,
        subCategories,
        activePage: 'categories',
        layout: AdminLayout,
        title: `${category.name} - IMS Admin`
    });
    return c.html(html);
});

// Price Lists
adminRoutes.get('/price-lists', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const catalog = c.ctx.get('domain.catalog');
    const cursor = c.req.query('cursor');

    const { items: priceLists, nextCursor } = await catalog.useCases.listPriceLists.execute(tenantId, { limit: 50, cursor });

    const html = await renderPage(PriceListsPage, {
        user,
        priceLists,
        nextCursor,
        activePage: 'price-lists',
        layout: AdminLayout,
        title: 'Price Lists - IMS Admin'
    });
    return c.html(html);
});

adminRoutes.get('/price-lists/new', async (c) => {
    const user = c.get('user');

    const html = await renderPage(CreatePriceListPage, {
        user,
        activePage: 'price-lists',
        layout: AdminLayout,
        title: 'New Price List - IMS Admin'
    });
    return c.html(html);
});

adminRoutes.post('/price-lists', async (c) => {
    const tenantId = c.get('tenantId');
    const catalog = c.ctx.get('domain.catalog');
    const body = await c.req.parseBody();

    try {
        await catalog.useCases.createPriceList.execute(tenantId, {
            name: body.name,
            currency: body.currency,
            description: body.description,
            prices: {} // Initial empty prices
        });
        return c.redirect('/admin/price-lists');
    } catch (e) {
        return c.text(e.message, 400);
    }
});

adminRoutes.get('/price-lists/:id', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const plId = c.req.param('id');
    const catalog = c.ctx.get('domain.catalog');

    const priceList = await catalog.repositories.priceList.findById(tenantId, plId);
    if (!priceList) return c.text('Price List not found', 404);

    const html = await renderPage(PriceListDetailPage, {
        user,
        priceList,
        activePage: 'price-lists',
        layout: AdminLayout,
        title: `${priceList.name} - IMS Admin`
    });
    return c.html(html);
});

// --- Procurement Routes ---

adminRoutes.get('/suppliers', async (c) => {
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

adminRoutes.get('/suppliers/new', async (c) => {
    const user = c.get('user');

    const html = await renderPage(CreateSupplierPage, {
        user,
        activePage: 'suppliers',
        layout: AdminLayout,
        title: 'New Supplier - IMS Admin'
    });
    return c.html(html);
});

adminRoutes.post('/suppliers', async (c) => {
    const tenantId = c.get('tenantId');
    const procurement = c.ctx.get('domain.procurement');
    const body = await c.req.parseBody();

    try {
        await procurement.useCases.createSupplier.execute(tenantId, body);
        return c.redirect('/admin/suppliers');
    } catch (e) {
        return c.text(e.message, 400);
    }
});

adminRoutes.get('/suppliers/:id', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const supplierId = c.req.param('id');
    const procurement = c.ctx.get('domain.procurement');

    const supplier = await procurement.repositories.supplier.findById(tenantId, supplierId);
    if (!supplier) return c.text('Supplier not found', 404);

    // Get POs for this supplier
    // This is naive filtering in memory as repo doesn't support findBySupplierId yet
    // In a real app we'd add an index
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

adminRoutes.get('/purchase-orders', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const procurement = c.ctx.get('domain.procurement');

    const { items: purchaseOrders } = await procurement.useCases.listPurchaseOrders.execute(tenantId);

    // Enrich with supplier names
    // Note: In real app, might want to join or cache this
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

adminRoutes.get('/purchase-orders/new', async (c) => {
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

adminRoutes.post('/purchase-orders', async (c) => {
    const tenantId = c.get('tenantId');
    const procurement = c.ctx.get('domain.procurement');
    const body = await c.req.parseBody();

    // Parse nested items from form (e.g. items[0][productId])
    const items = [];
    const itemKeys = Object.keys(body).filter(k => k.startsWith('items['));
    // Naive parsing for limited nesting
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
        return c.redirect('/admin/purchase-orders');
    } catch (e) {
        return c.text(e.message, 400);
    }
});

adminRoutes.get('/purchase-orders/:id', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const poId = c.req.param('id');
    const procurement = c.ctx.get('domain.procurement');
    const catalog = c.ctx.get('domain.catalog');

    const po = await procurement.useCases.getPurchaseOrder.execute(tenantId, poId);
    if (!po) return c.text('PO not found', 404);

    // Enrich items
    for (const item of po.items) {
        const product = await catalog.useCases.getProduct.execute(tenantId, item.productId).catch(() => null);
        item.productName = product ? product.name : 'Unknown';
        item.sku = product ? product.sku : '';
    }

    // Enrich Supplier
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

adminRoutes.get('/purchase-orders/:id/receive', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const poId = c.req.param('id');
    const procurement = c.ctx.get('domain.procurement');
    const inventory = c.ctx.get('domain.inventory');
    const catalog = c.ctx.get('domain.catalog');

    const po = await procurement.useCases.getPurchaseOrder.execute(tenantId, poId);
    if (!po) return c.text('PO not found', 404);

    // Enrich items
    for (const item of po.items) {
        const product = await catalog.useCases.getProduct.execute(tenantId, item.productId).catch(() => null); // Re-fetch
        if (!product) {
            // Fallback for simple listProducts call if getProduct not directly available in some versions
            // but we added it earlier.
             item.productName = 'Unknown';
        } else {
             item.productName = product.name;
             item.sku = product.sku;
        }
    }

    // Get Locations
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

adminRoutes.post('/purchase-orders/:id/receive', async (c) => {
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
        return c.redirect('/admin/purchase-orders');
    } catch (e) {
        return c.text(e.message, 400);
    }
});

// --- Manufacturing Routes ---

adminRoutes.get('/boms', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const manufacturing = c.ctx.get('domain.manufacturing');
    const catalog = c.ctx.get('domain.catalog'); // To get product names

    const { items: boms } = await manufacturing.useCases.listBOMs.execute(tenantId);

    // Enrich product names
    for (const bom of boms) {
        const product = await catalog.useCases.getProduct.execute(tenantId, bom.productId).catch(() => null); // getProduct might not be directly exposed in useCases list?
        // Wait, catalog.useCases.listProducts returns list. getProduct?
        // Let's check catalog use cases.
        // Assuming we can fetch product details. If not, we skip.
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

adminRoutes.get('/boms/:id', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const bomId = c.req.param('id');
    const manufacturing = c.ctx.get('domain.manufacturing');
    const catalog = c.ctx.get('domain.catalog');

    const bom = await manufacturing.repositories.bom.findById(tenantId, bomId);
    if (!bom) return c.text('BOM not found', 404);

    // Enrich Finished Product
    const product = await catalog.useCases.getProduct.execute(tenantId, bom.productId).catch(() => null);
    bom.productName = product ? product.name : 'Unknown';

    // Enrich Components
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

adminRoutes.get('/boms/new', async (c) => {
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

adminRoutes.post('/boms', async (c) => {
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
        return c.redirect('/admin/boms');
    } catch (e) {
        return c.text(e.message, 400);
    }
});

adminRoutes.get('/work-orders', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const manufacturing = c.ctx.get('domain.manufacturing');
    const catalog = c.ctx.get('domain.catalog');

    const { items: workOrders } = await manufacturing.useCases.listWorkOrders.execute(tenantId);

    // Enrich
    for (const wo of workOrders) {
        // Need to get BOM to get Product Name
        const bom = await manufacturing.repositories.bom.findById(tenantId, wo.bomId);
        if (bom) {
             // const product = ...
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

adminRoutes.get('/work-orders/:id', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const woId = c.req.param('id');
    const manufacturing = c.ctx.get('domain.manufacturing');
    const catalog = c.ctx.get('domain.catalog');

    const wo = await manufacturing.repositories.workOrder.findById(tenantId, woId);
    if (!wo) return c.text('Work Order not found', 404);

    const bom = await manufacturing.repositories.bom.findById(tenantId, wo.bomId);

    // Enrich Product Name (from BOM)
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

adminRoutes.get('/work-orders/new', async (c) => {
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

adminRoutes.post('/work-orders', async (c) => {
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
        return c.redirect('/admin/work-orders');
    } catch (e) {
        return c.text(e.message, 400);
    }
});

adminRoutes.post('/work-orders/:id/complete', async (c) => {
    // This route is called from the modal/form
    const tenantId = c.get('tenantId');
    const woId = c.req.param('id');
    const manufacturing = c.ctx.get('domain.manufacturing');
    const body = await c.req.parseBody();

    // If request comes from the list page button (which we changed to form), it might be missing locationId
    // But we need to redirect to the selection page if locationId is missing?
    // Actually, we should change the list page button to be a link to /complete page.

    if (body.locationId) {
        try {
            await manufacturing.useCases.completeWorkOrder.execute(tenantId, woId, {
                locationId: body.locationId
            });
            return c.redirect('/admin/work-orders');
        } catch (e) {
            return c.text(e.message, 400);
        }
    } else {
        // Render the completion selection page
        const user = c.get('user');
        const inventory = c.ctx.get('domain.inventory');
        const wo = await manufacturing.repositories.workOrder.findById(tenantId, woId);

        // Enrich
        const bom = await manufacturing.repositories.bom.findById(tenantId, wo.bomId);
        // We'd need to fetch product name...
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

adminRoutes.get('/locations', async (c) => {
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
});

adminRoutes.get('/inventory', async (c) => {
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
});

// Warehouse Routes
adminRoutes.get('/warehouses', async (c) => {
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
});

adminRoutes.get('/orders', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const orders = c.ctx.get('domain.orders');
    const cursor = c.req.query('cursor');
    const limit = 10;
    const { items: orderList, nextCursor } = await orders.useCases.listOrders.execute(tenantId, { limit, cursor });

    const html = await renderPage(OrdersPage, {
      user,
      orders: orderList,
      nextCursor,
      currentUrl: c.req.url,
      layout: AdminLayout,
      title: 'Orders - IMS Admin'
    });

    return c.html(html);
});

adminRoutes.get('/orders/new', async (c) => {
    try {
        const user = c.get('user');
        const tenantId = c.get('tenantId');
        const ac = c.ctx.get('domain.accessControl');
        const catalog = c.ctx.get('domain.catalog');

        // Get Customers (approximate)
        const { items: allUsers } = await ac.useCases.listUsers.execute(tenantId, { limit: 100 });

        // Get Products
        // catalog.useCases.listProducts returns array directly in some implementations or { items }?
        // Let's check the memory or other routes. catalog route uses: await catalog.useCases.listProducts.execute(tenantId, page, 50);
        // And it assigns it to `products`.
        // In other routes (CreateProductPage), it uses `const { items: categories }`.
        // Let's check `catalog-page.jsx` usage.
        // In `/catalog`, `products` is passed to `CatalogPage`.

        // Let's inspect listProducts return type by checking what `catalog-page` expects or just console.log.
        // Assuming based on `/catalog` route: `products = await catalog.useCases.listProducts.execute(tenantId, page, 50);`
        // If that returns { items: [] }, then `products` is that object.
        // Wait, in `/catalog`, it does: `products = await catalog.useCases.listProducts...` then passes `products` to `CatalogPage`.
        // If I look at `CatalogPage` (not visible here), standard is `{ items, nextCursor }`.

        // However, in my `/orders/new` code, I did: `const { items: products } = await catalog.useCases.listProducts.execute(tenantId, 1, 100);`
        // The args `1, 100` might be wrong if it expects `{ limit, cursor }` or just `page, limit`.
        // The `/catalog` route uses `execute(tenantId, page, 50)`. So it seems to be positional arguments for page/limit?
        // BUT `listCategories` uses `{ limit: 50, cursor }`.
        // Let's try to align with `/catalog` usage: `execute(tenantId, 1, 100)`.

        // But if `execute` returns the array directly (legacy?) or `{ items }`?
        // Let's try to be safe.
        const productsResult = await catalog.useCases.listProducts.execute(tenantId, 1, 100);
        const products = Array.isArray(productsResult) ? productsResult : (productsResult.items || []);

        const html = await renderPage(CreateOrderPage, {
            user,
            customers: allUsers,
            products,
            activePage: 'orders',
            layout: AdminLayout,
            title: 'New Order - IMS Admin'
        });
        return c.html(html);
    } catch (e) {
        return c.text('Error loading Create Order Page: ' + e.message + '\n' + e.stack, 500);
    }
});

adminRoutes.post('/orders', async (c) => {
    const tenantId = c.get('tenantId');
    const orders = c.ctx.get('domain.orders');
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

    if (items.length === 0) return c.text('No items selected', 400);

    try {
        await orders.useCases.createOrder.execute(tenantId, body.userId, items);
        return c.redirect('/admin/orders');
    } catch (e) {
        return c.text(e.message, 400);
    }
});

adminRoutes.get('/products/:id', async (c) => {
  const user = c.get('user');
  const tenantId = c.get('tenantId');
  const productId = c.req.param('id');
  const inventory = c.ctx.get('domain.inventory');
  const cursor = c.req.query('cursor');

  const product = await inventory.useCases.getProduct.execute(tenantId, productId);
  if (!product) return c.text('Product not found', 404);

  const [{ items: movements, nextCursor }, stockEntries] = await Promise.all([
    inventory.useCases.listStockMovements.execute(tenantId, productId, { limit: 20, cursor }),
    inventory.repositories.stock.getEntriesForProduct(tenantId, productId)
  ]);

  const currentStock = stockEntries.reduce((sum, e) => sum + (e.quantity - e.reservedQuantity), 0);

  const html = await renderPage(ProductDetailPage, {
    user,
    product,
    movements,
    stock: currentStock,
    nextCursor,
    currentUrl: c.req.url,
    layout: AdminLayout,
    title: `${product.name} - IMS Admin`
  });

  return c.html(html);
});

adminRoutes.get('/orders/:id', async (c) => {
  const user = c.get('user');
  const tenantId = c.get('tenantId');
  const orderId = c.req.param('id');
  const orders = c.ctx.get('domain.orders');
  const catalog = c.ctx.get('domain.catalog');

  const order = await orders.useCases.getOrder.execute(tenantId, orderId);
  if (!order) return c.text('Order not found', 404);

  // Enrich items with product details (e.g. name)
  for (const item of order.items) {
      if (!item.productName) {
          const product = await catalog.useCases.getProduct.execute(tenantId, item.productId).catch(() => null);
          item.productName = product ? product.name : 'Unknown Product';
      }
  }

  // Fetch Shipments
  const { items: shipments } = await orders.useCases.listShipments.execute(tenantId, { orderId });

  const html = await renderPage(OrderDetailPage, {
    user,
    order,
    shipments,
    layout: AdminLayout,
    title: `Order #${order.id} - IMS Admin`
  });

  return c.html(html);
});

// Pick List
adminRoutes.get('/orders/:id/pick-list', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const orderId = c.req.param('id');
    const orders = c.ctx.get('domain.orders');
    const inventory = c.ctx.get('domain.inventory');

    const order = await orders.useCases.getOrder.execute(tenantId, orderId);
    if (!order) return c.text('Order not found', 404);

    // Get Allocated Movements
    const movements = await inventory.repositories.stockMovement.getByReference(tenantId, orderId);
    const allocated = movements.filter(m => m.type === 'allocated');

    // Enrich with location, product, batch
    const pickItems = await Promise.all(allocated.map(async (item) => {
        const [product, location, batch] = await Promise.all([
            inventory.useCases.getProduct.execute(tenantId, item.productId),
            inventory.repositories.location.findById(tenantId, item.fromLocationId),
            item.batchId ? inventory.repositories.batch.findById(tenantId, item.batchId) : null
        ]);
        return {
            ...item,
            productName: product?.name || 'Unknown',
            sku: product?.sku || 'UNKNOWN',
            locationCode: location?.code || 'Unknown Loc',
            batchNumber: batch?.batchNumber,
            expiryDate: batch?.expiryDate
        };
    }));

    // Sort by location code
    pickItems.sort((a, b) => a.locationCode.localeCompare(b.locationCode));

    const html = await renderPage(PickListPage, {
        user,
        order,
        pickItems,
        layout: AdminLayout, // Or simplified layout?
        title: `Pick List #${order.id} - IMS Admin`
    });
    return c.html(html);
});

// Packing Slip
adminRoutes.get('/orders/:id/packing-slip', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const orderId = c.req.param('id');
    const orders = c.ctx.get('domain.orders');

    const order = await orders.useCases.getOrder.execute(tenantId, orderId);
    if (!order) return c.text('Order not found', 404);

    const html = await renderPage(PackingSlipPage, {
        user,
        order,
        layout: AdminLayout,
        title: `Packing Slip #${order.id} - IMS Admin`
    });
    return c.html(html);
});

adminRoutes.post('/orders/:id/status', async (c) => {
  const tenantId = c.get('tenantId');
  const orderId = c.req.param('id');
  const orders = c.ctx.get('domain.orders');
  const body = await c.req.parseBody();
  const status = body.status;

  try {
    await orders.useCases.updateOrderStatus.execute(tenantId, orderId, status);
    return c.redirect(`/admin/orders/${orderId}`);
  } catch (e) {
    return c.text(`Error updating order: ${e.message}`, 400);
  }
});

// --- RBAC & CRM Pages (SSR Refactored) ---

adminRoutes.get('/users', async (c) => {
    try {
        const user = c.get('user');
        const tenantId = c.get('tenantId');
        const ac = c.ctx.get('domain.accessControl');

        if (!ac) throw new Error('Access Control domain not found');
        if (!ac.useCases) throw new Error('Access Control use cases not found');
        if (!ac.useCases.listUsers) throw new Error('listUsers use case not found');

        // Fetch users and roles server-side
        const { items: users } = await ac.useCases.listUsers.execute(tenantId, { limit: 50 });
        const roles = await ac.useCases.listRoles.execute(tenantId);

        const html = await renderPage(UsersPage, {
            user,
            users,
            roles,
            activePage: 'users',
            layout: AdminLayout,
            title: 'Users & Roles - IMS Admin'
        });
        return c.html(html);
    } catch (e) {
        return c.text(e.message + '\n' + e.stack, 500);
    }
});

adminRoutes.get('/users/new', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const ac = c.ctx.get('domain.accessControl');
    const roles = await ac.useCases.listRoles.execute(tenantId);

    const html = await renderPage(CreateUserPage, {
        user,
        roles,
        activePage: 'users',
        layout: AdminLayout,
        title: 'New User - IMS Admin'
    });
    return c.html(html);
});

adminRoutes.post('/users', async (c) => {
    const tenantId = c.get('tenantId');
    const ac = c.ctx.get('domain.accessControl');
    const body = await c.req.parseBody();

    try {
        const newUser = await ac.useCases.registerUser.execute(tenantId, {
            name: body.name,
            email: body.email,
            password: body.password
        });

        if (body.roleId) {
            await ac.useCases.assignRole.execute(tenantId, {
                userId: newUser.id,
                roleIds: [body.roleId]
            });
        }
        return c.redirect('/admin/users');
    } catch (e) {
        return c.text(e.message, 400);
    }
});

adminRoutes.get('/users/:id', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const userId = c.req.param('id');
    const ac = c.ctx.get('domain.accessControl');

    // Currently assume listUsers or we might have getUser?
    // Repo usually has findById.
    const userData = await ac.repositories.user.findById(tenantId, userId);
    if (!userData) return c.text('User not found', 404);

    const roles = await ac.useCases.listRoles.execute(tenantId);

    const html = await renderPage(UserDetailPage, {
        user,
        userData,
        roles,
        activePage: 'users',
        layout: AdminLayout,
        title: `${userData.name} - IMS Admin`
    });
    return c.html(html);
});

adminRoutes.get('/roles', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const ac = c.ctx.get('domain.accessControl');

    const roles = await ac.useCases.listRoles.execute(tenantId);

    const html = await renderPage(RolesPage, {
        user,
        roles,
        activePage: 'roles',
        layout: AdminLayout,
        title: 'Roles - IMS Admin'
    });
    return c.html(html);
});

adminRoutes.get('/roles/new', async (c) => {
    const user = c.get('user');

    const html = await renderPage(CreateRolePage, {
        user,
        activePage: 'roles',
        layout: AdminLayout,
        title: 'New Role - IMS Admin'
    });
    return c.html(html);
});

adminRoutes.post('/roles', async (c) => {
    const tenantId = c.get('tenantId');
    const ac = c.ctx.get('domain.accessControl');
    const body = await c.req.parseBody();

    try {
        await ac.useCases.createRole.execute(tenantId, {
            name: body.name,
            permissions: []
        });
        return c.redirect('/admin/roles');
    } catch (e) {
        return c.text(e.message, 400);
    }
});

adminRoutes.get('/roles/:id', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const roleId = c.req.param('id');
    const ac = c.ctx.get('domain.accessControl');

    // Role repo findById
    const role = await ac.repositories.role.findById(tenantId, roleId);
    if (!role) return c.text('Role not found', 404);

    const html = await renderPage(RoleDetailPage, {
        user,
        role,
        activePage: 'roles',
        layout: AdminLayout,
        title: `${role.name} - IMS Admin`
    });
    return c.html(html);
});

adminRoutes.get('/customers', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const ac = c.ctx.get('domain.accessControl');

    const { items: customers } = await ac.useCases.listUsers.execute(tenantId, { limit: 50 });

    const html = await renderPage(CustomersPage, {
        user,
        customers,
        activePage: 'customers',
        layout: AdminLayout,
        title: 'Customers - IMS Admin'
    });
    return c.html(html);
});

adminRoutes.get('/customers/new', async (c) => {
    const user = c.get('user');
    const html = await renderPage(CreateCustomerPage, {
        user,
        activePage: 'customers',
        layout: AdminLayout,
        title: 'New Customer - IMS Admin'
    });
    return c.html(html);
});

adminRoutes.post('/customers', async (c) => {
    const tenantId = c.get('tenantId');
    const ac = c.ctx.get('domain.accessControl');
    const body = await c.req.parseBody();

    try {
        const newUser = await ac.useCases.registerUser.execute(tenantId, {
            name: body.name,
            email: body.email,
            password: body.password
        });

        // Find customer role
        const roles = await ac.useCases.listRoles.execute(tenantId);
        const customerRole = roles.find(r => r.name.toLowerCase() === 'customer');

        if (customerRole) {
            await ac.useCases.assignRole.execute(tenantId, {
                userId: newUser.id,
                roleIds: [customerRole.id]
            });
        }

        return c.redirect('/admin/customers');
    } catch (e) {
        return c.text(e.message, 400);
    }
});

adminRoutes.get('/customers/:id', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const customerId = c.req.param('id');
    const ac = c.ctx.get('domain.accessControl');

    try {
        const customerData = await ac.useCases.getCustomerProfile.execute(tenantId, customerId);
        const html = await renderPage(CustomerDetailPage, {
            user,
            customer: customerData, // Pass full data bundle
            activePage: 'customers',
            layout: AdminLayout,
            title: 'Customer Details - IMS Admin'
        });
        return c.html(html);
    } catch (e) {
        return c.text(e.message, 404);
    }
});

// Create Shipment UI
adminRoutes.get('/orders/:id/shipments/new', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const orderId = c.req.param('id');
    const orders = c.ctx.get('domain.orders');
    const catalog = c.ctx.get('domain.catalog');

    const order = await orders.useCases.getOrder.execute(tenantId, orderId);
    if (!order) return c.text('Order not found', 404);

    // Enrich items
    for (const item of order.items) {
        if (!item.productName) {
            const p = await catalog.useCases.getProduct.execute(tenantId, item.productId).catch(() => null);
            item.productName = p ? p.name : 'Unknown Product';
            item.sku = p ? p.sku : '';
        }
    }

    const html = await renderPage(CreateShipmentPage, {
        user,
        order,
        orderItems: order.items,
        activePage: 'orders',
        layout: AdminLayout,
        title: 'New Shipment - IMS Admin'
    });
    return c.html(html);
});

// Create Shipment POST
adminRoutes.post('/orders/:id/shipments', async (c) => {
    const tenantId = c.get('tenantId');
    const orderId = c.req.param('id');
    const orders = c.ctx.get('domain.orders');
    const body = await c.req.parseBody();

    // Parse Items
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

    if (items.length === 0) return c.text('No items selected for shipment', 400);

    try {
        await orders.useCases.createShipment.execute(tenantId, {
            orderId,
            carrier: body.carrier,
            trackingNumber: body.trackingNumber,
            code: `SH-${Date.now()}`, // Generate simple code
            items
        });
        return c.redirect(`/admin/orders/${orderId}`);
    } catch (e) {
        return c.text(e.message, 400);
    }
});

// Shipment Detail
adminRoutes.get('/shipments/:id', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const shipmentId = c.req.param('id');
    const orders = c.ctx.get('domain.orders');
    const catalog = c.ctx.get('domain.catalog');

    const shipment = await orders.repositories.shipment.findById(tenantId, shipmentId);

    if (!shipment) return c.text('Shipment not found', 404);

    const order = await orders.useCases.getOrder.execute(tenantId, shipment.orderId);

    // Enrich shipment items
    const enrichedItems = await Promise.all(shipment.items.map(async (item) => {
        const p = await catalog.useCases.getProduct.execute(tenantId, item.productId).catch(() => null);
        return {
            ...item,
            productName: p ? p.name : 'Unknown',
            sku: p ? p.sku : ''
        };
    }));

    const html = await renderPage(ShipmentDetailPage, {
        user,
        shipment,
        items: enrichedItems,
        order,
        layout: AdminLayout,
        title: `Shipment ${shipment.code} - IMS Admin`
    });
    return c.html(html);
});

// List Shipments (NEW)
adminRoutes.get('/shipments', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const orders = c.ctx.get('domain.orders');
    const cursor = c.req.query('cursor');

    const { items: shipments, nextCursor } = await orders.useCases.listShipments.execute(tenantId, { limit: 20, cursor });

    const html = await renderPage(ShipmentsPage, {
        user,
        shipments,
        nextCursor,
        currentUrl: c.req.url,
        layout: AdminLayout,
        title: 'Shipments - IMS Admin'
    });
    return c.html(html);
});
