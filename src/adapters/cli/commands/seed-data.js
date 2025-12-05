// src/adapters/cli/commands/seed-data.js

import { createContextRegistry } from '../../../utils/registry/context-registry.js';
import { createConfigService } from '../../../utils/config/config-service.js';
import { createPersistenceContext } from '../../../infra/persistence/index.js';
import { createMessagingContext } from '../../../infra/messaging/index.js';
import { createObsContext } from '../../../infra/obs/index.js';
import { createSecurityContext } from '../../../infra/security/index.js';
import { createRealtimeContext } from '../../../infra/realtime/index.js';
import { createAccessControlContext } from '../../../ctx/access-control/index.js';
import { createInventoryContext } from '../../../ctx/inventory/index.js';
import { createOrdersContext } from '../../../ctx/orders/index.js';
import { createCatalogContext } from '../../../ctx/catalog/index.js';
import { createProcurementContext } from '../../../ctx/procurement/index.js';
import { createManufacturingContext } from '../../../ctx/manufacturing/index.js';

// --- HELPERS ---

const randomDate = (start, end) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pickRandomSubset = (arr, maxCount) => {
    const shuffled = arr.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.floor(Math.random() * maxCount) + 1);
};

// Data Pools
const ADJECTIVES = ['Small', 'Ergonomic', 'Rustic', 'Intelligent', 'Gorgeous', 'Incredible', 'Fantastic', 'Practical', 'Sleek', 'Awesome', 'Industrial', 'Heavy-Duty', 'Lightweight', 'Aerodynamic', 'Durable'];
const MATERIALS = ['Steel', 'Wooden', 'Concrete', 'Plastic', 'Cotton', 'Granite', 'Rubber', 'Metal', 'Soft', 'Fresh', 'Carbon Fiber', 'Titanium', 'Leather', 'Silk', 'Wool'];
const PRODUCT_TYPES = ['Chair', 'Car', 'Computer', 'Keyboard', 'Mouse', 'Bike', 'Ball', 'Gloves', 'Pants', 'Shirt', 'Table', 'Shoes', 'Hat', 'Towels', 'Soap', 'Tuna', 'Chicken', 'Fish', 'Cheese', 'Bacon', 'Pizza', 'Salad', 'Sausages', 'Chips', 'Laptop', 'Monitor', 'Headphones', 'Speaker', 'Phone', 'Camera', 'Lens', 'Bag', 'Watch', 'Wallet', 'Lamp', 'Desk', 'Bed', 'Sofa'];

const CATEGORY_TREE = {
    'Electronics': ['Computers', 'Phones', 'Cameras', 'Audio', 'Accessories'],
    'Clothing': ['Men', 'Women', 'Kids', 'Sportswear', 'Shoes'],
    'Home & Garden': ['Furniture', 'Kitchen', 'Bedding', 'Decor', 'Garden'],
    'Sports': ['Fitness', 'Cycling', 'Team Sports', 'Camping', 'Water Sports'],
    'Automotive': ['Parts', 'Accessories', 'Tools', 'Car Care', 'Electronics'],
    'Groceries': ['Fresh', 'Pantry', 'Frozen', 'Beverages', 'Snacks'],
    'Industrial': ['Tools', 'Hardware', 'Safety', 'Materials', 'Machinery']
};

const FIRST_NAMES = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

const CARRIERS = ['UPS', 'FedEx', 'USPS', 'DHL'];

// --- MAIN SCRIPT ---

async function bootstrap() {
    const environment = Deno.env.get('ENVIRONMENT') || 'local';
    const tenantId = Deno.args[0] || 'default';

    console.log(`🌱 Seeding EXTENSIVE data for tenant: ${tenantId} in ${environment} mode...`);

    const config = await createConfigService(environment);
    const ctx = createContextRegistry();

    // Register contexts
    ctx
        .registerInfra('persistence', createPersistenceContext, [])
        .registerInfra('obs', createObsContext, ['infra.persistence'])
        .registerInfra('messaging', createMessagingContext, ['infra.persistence'])
        .registerInfra('security', createSecurityContext, [])
        .registerInfra('realtime', createRealtimeContext, ['infra.messaging'])
        .registerDomain('accessControl', createAccessControlContext, ['infra.persistence', 'infra.obs', 'infra.security'])
        .registerDomain('inventory', createInventoryContext, ['infra.persistence', 'infra.obs', 'infra.messaging', 'domain.accessControl'])
        .registerDomain('orders', createOrdersContext, ['infra.persistence', 'infra.obs', 'infra.messaging', 'domain.inventory', 'domain.accessControl'])
        .registerDomain('catalog', createCatalogContext, ['infra.persistence', 'infra.obs', 'domain.inventory'])
        .registerDomain('procurement', createProcurementContext, ['infra.persistence', 'domain.inventory'])
        .registerDomain('manufacturing', createManufacturingContext, ['infra.persistence', 'domain.inventory']);

    await ctx.initialize(config);

    const persistence = ctx.get('infra.persistence');
    const accessControl = ctx.get('domain.accessControl');
    const inventory = ctx.get('domain.inventory');
    const orders = ctx.get('domain.orders');
    const catalog = ctx.get('domain.catalog');
    const procurement = ctx.get('domain.procurement');
    const manufacturing = ctx.get('domain.manufacturing');

    // --- 0. Clean Database ---
    console.log('🧹 Cleaning database...');
    await persistence.kvPool.withConnection(async (kv) => {
        const iter = kv.list({ prefix: ['tenants', tenantId] });
        for await (const res of iter) {
            await kv.delete(res.key);
        }
    });
    console.log('   ✅ Database cleaned.');

    // --- 1. Roles & Users ---
    console.log('🛡️  Creating Roles & Admin User...');

    // Create Roles
    const adminRole = await accessControl.useCases.createRole.execute(tenantId, { name: 'admin', permissions: [{ resource: '*', action: '*' }] });
    const managerRole = await accessControl.useCases.createRole.execute(tenantId, { name: 'manager', permissions: [{ resource: 'products', action: '*' }, { resource: 'orders', action: 'read' }] });
    const customerRole = await accessControl.useCases.createRole.execute(tenantId, { name: 'customer', permissions: [{ resource: 'products', action: 'read' }] });

    // Admin User
    const adminUser = await accessControl.useCases.registerUser.execute(tenantId, { email: 'admin@imsshop.com', password: 'password123', name: 'System Admin' });
    await accessControl.useCases.assignRole.execute(tenantId, { userId: adminUser.id, roleIds: [adminRole.id] });

    // Manager User
    const managerUser = await accessControl.useCases.registerUser.execute(tenantId, { email: 'manager@imsshop.com', password: 'password123', name: 'Store Manager' });
    await accessControl.useCases.assignRole.execute(tenantId, { userId: managerUser.id, roleIds: [managerRole.id] });

    console.log('   ✅ Admin & Manager created.');

    // --- 2. Warehouses & Locations ---
    console.log('🏭 Creating Warehouses & Locations...');
    const warehousesData = [
        { name: 'Central Distribution (East)', code: 'WH-EAST' },
        { name: 'West Coast Hub', code: 'WH-WEST' },
        { name: 'Euro Logistics', code: 'WH-EU' },
        { name: 'Asia Pacific Center', code: 'WH-APAC' }
    ];

    const locationIds = []; // Pool of location IDs for stocking

    for (const w of warehousesData) {
        const warehouse = await inventory.useCases.createWarehouse.execute(tenantId, w);

        // Zones
        for (const zoneChar of ['A', 'B', 'C']) {
            const zone = await inventory.useCases.createLocation.execute(tenantId, { warehouseId: warehouse.id, code: `Zone-${zoneChar}`, type: 'ZONE' });

            // Aisles
            for (let i = 1; i <= 5; i++) {
                const aisle = await inventory.useCases.createLocation.execute(tenantId, { warehouseId: warehouse.id, parentId: zone.id, code: `Z${zoneChar}-Aisle-${i}`, type: 'AISLE' });
                locationIds.push(aisle.id); // Stock at aisle level for simplicity or add Bins

                // Bins (Optional deep hierarchy, let's add a few bins for realism)
                for (let b = 1; b <= 5; b++) {
                   const bin = await inventory.useCases.createLocation.execute(tenantId, { warehouseId: warehouse.id, parentId: aisle.id, code: `Z${zoneChar}-A${i}-Bin-${b}`, type: 'BIN' });
                   locationIds.push(bin.id);
                }
            }
        }
    }
    console.log(`   ✅ Created ${warehousesData.length} warehouses and ${locationIds.length} locations.`);


    // --- 3. Categories & Products ---
    console.log('📦 Creating Catalog (1000 Products)...');

    const categoryIds = [];
    const products = [];

    // Create Categories
    for (const [mainCat, subCats] of Object.entries(CATEGORY_TREE)) {
        const main = await catalog.useCases.createCategory.execute(tenantId, { name: mainCat, description: `All ${mainCat} items` });
        categoryIds.push(main.id);

        for (const sub of subCats) {
            const child = await catalog.useCases.createCategory.execute(tenantId, { name: sub, parentId: main.id });
            categoryIds.push(child.id);
        }
    }

    // Generate 1000 Products
    // We'll do this in batches to avoid event loop blocking if needed, but 1000 is small enough.
    // Price Lists
    const retailList = await catalog.useCases.createPriceList.execute(tenantId, { name: 'Retail USD', currency: 'USD' });
    const wholesaleList = await catalog.useCases.createPriceList.execute(tenantId, { name: 'Wholesale USD', currency: 'USD' });

    const productPrices = {}; // For wholesale list

    for (let i = 0; i < 1000; i++) {
        const isConfigurable = Math.random() < 0.1; // 10% configurable
        const name = `${pickRandom(ADJECTIVES)} ${pickRandom(MATERIALS)} ${pickRandom(PRODUCT_TYPES)}`;
        const sku = `SKU-${10000 + i}`;
        const price = parseFloat((Math.random() * 200 + 10).toFixed(2));
        const categoryId = pickRandom(categoryIds);

        try {
            if (isConfigurable) {
                const parent = await catalog.useCases.createProduct.execute(tenantId, {
                    sku: `${sku}-P`,
                    name: name,
                    description: `Configurable version of ${name}`,
                    price,
                    type: 'CONFIGURABLE',
                    configurableAttributes: ['color', 'size'],
                    category: 'General',
                    status: 'ACTIVE'
                });
                products.push(parent);

                // Create Variants
                const colors = ['Red', 'Blue', 'Black'];
                const sizes = ['S', 'M', 'L'];
                for (const c of colors) {
                    for (const s of sizes) {
                        const vSku = `${sku}-${c.substring(0,1)}-${s}`;
                        const variant = await catalog.useCases.createProduct.execute(tenantId, {
                            sku: vSku,
                            name: `${name} - ${c} ${s}`,
                            price,
                            type: 'VARIANT',
                            parentId: parent.id,
                            variantAttributes: { color: c, size: s },
                            category: 'General',
                            status: 'ACTIVE'
                        });
                        products.push(variant);
                        productPrices[variant.id] = parseFloat((price * 0.7).toFixed(2));
                    }
                }
            } else {
                const p = await catalog.useCases.createProduct.execute(tenantId, {
                    sku,
                    name,
                    description: `High quality ${name}`,
                    price,
                    type: 'SIMPLE',
                    category: 'General', // Simplified
                    status: 'ACTIVE'
                });
                products.push(p);
                productPrices[p.id] = parseFloat((price * 0.7).toFixed(2));
            }
        } catch (e) { /* ignore dupes */ }

        if (i % 100 === 0) process.stdout.write('.');
    }
    console.log('\n   ✅ Products created.');

    // Update Wholesale Price List
    retailList.prices = productPrices; // Naive reuse
    await catalog.repositories.priceList.save(tenantId, wholesaleList);

    // --- 4. Initial Stock (Historical) ---
    console.log('📥 Receiving Initial Stock (Historical)...');

    // We'll receive stock ~13 months ago to ensure it's available for all orders
    const stockBaseDate = new Date();
    stockBaseDate.setMonth(stockBaseDate.getMonth() - 13);

    for (const p of products) {
        if (p.type === 'CONFIGURABLE') continue; // Don't stock parents

        // Receive stock in 2-3 random locations
        const targetLocs = pickRandomSubset(locationIds, 2);

        for (const locId of targetLocs) {
            await inventory.useCases.receiveStock.execute(tenantId, {
                productId: p.id,
                locationId: locId,
                quantity: Math.floor(Math.random() * 500) + 100, // Large stock to fulfill 5000 orders
                reason: 'Initial Inventory',
                userId: adminUser.id,
                date: stockBaseDate.toISOString()
            });
        }
    }
    console.log('   ✅ Initial stock received.');


    // --- 5. Customers ---
    console.log('👥 Registering Customers...');
    const customers = [];
    for (let i = 0; i < 100; i++) {
        const fname = pickRandom(FIRST_NAMES);
        const lname = pickRandom(LAST_NAMES);
        const email = `${fname.toLowerCase()}.${lname.toLowerCase()}${i}@example.com`;

        try {
            const user = await accessControl.useCases.registerUser.execute(tenantId, { email, password: 'password123', name: `${fname} ${lname}` });
            await accessControl.useCases.assignRole.execute(tenantId, { userId: user.id, roleIds: [customerRole.id] });
            customers.push(user);
        } catch(e) {}
    }
    console.log(`   ✅ ${customers.length} customers registered.`);


    // --- 6. Orders & Shipments (The Big One) ---
    console.log('🛒 Generating 5000 Orders (Simulating last 12 months)...');

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 12);
    const endDate = new Date();

    // Sort products for easier picking
    const sellableProducts = products.filter(p => p.type !== 'CONFIGURABLE');

    let ordersCreatedCount = 0;

    // We will generate them chronologically to make logs look nice
    // Actually random is fine, but chronological is better for "event stream" realism
    // Let's generate 5000 random timestamps, sort them, then process.
    const timestamps = [];
    for(let i=0; i<5000; i++) {
        timestamps.push(randomDate(startDate, endDate));
    }
    timestamps.sort((a,b) => a - b);

    for (const orderDate of timestamps) {
        const customer = pickRandom(customers);
        const numItems = Math.floor(Math.random() * 5) + 1;
        const items = [];

        for(let j=0; j<numItems; j++) {
            const p = pickRandom(sellableProducts);
            items.push({ productId: p.id, quantity: Math.floor(Math.random() * 3) + 1 });
        }

        try {
            // 1. Create Order
            const order = await orders.useCases.createOrder.execute(tenantId, customer.id, items, orderDate.toISOString());

            // 2. Determine Fate based on Age
            const ageInDays = (endDate.getTime() - orderDate.getTime()) / (1000 * 3600 * 24);

            let targetStatus = 'CREATED';

            if (ageInDays > 14) {
                // Old orders: Mostly Delivered/Shipped
                const r = Math.random();
                if (r > 0.1) targetStatus = 'SHIPPED'; // We don't have explicit DELIVERED status transition logic exposed easily without marking shipment delivered.
                // Shipment entity has status, Order status is SHIPPED usually.
                else if (r > 0.05) targetStatus = 'CANCELLED';
                else targetStatus = 'SHIPPED';
            } else if (ageInDays > 3) {
                // Medium age
                const r = Math.random();
                if (r > 0.4) targetStatus = 'SHIPPED';
                else if (r > 0.2) targetStatus = 'PARTIALLY_SHIPPED';
                else targetStatus = 'PAID';
            } else {
                // Recent
                const r = Math.random();
                if (r > 0.5) targetStatus = 'PAID';
                else targetStatus = 'CREATED';
            }

            // 3. Apply Status / Fulfillment
            if (targetStatus === 'SHIPPED' || targetStatus === 'PARTIALLY_SHIPPED') {
                // Create Shipment
                // Delay shipment by 1-2 days from order
                const shipDate = new Date(orderDate.getTime() + (Math.random() * 48 * 3600 * 1000));
                if (shipDate > endDate) continue; // Haven't shipped yet

                const itemsToShip = targetStatus === 'SHIPPED' ? order.items : [order.items[0]]; // Simple partial logic

                await orders.useCases.createShipment.execute(tenantId, {
                    orderId: order.id,
                    items: itemsToShip.map(i => ({ productId: i.productId, quantity: i.quantity })),
                    carrier: pickRandom(CARRIERS),
                    trackingNumber: `1Z${Math.random().toString(36).substring(7).toUpperCase()}`,
                    shippedAt: shipDate.toISOString()
                });
            } else if (targetStatus === 'CANCELLED') {
                // await orders.useCases.cancelOrder.execute(...) // If exists
                // For now, skip cancellation logic to avoid complexity if use case missing
            } else if (targetStatus === 'PAID') {
                // await orders.useCases.payOrder.execute(...)
            }

            ordersCreatedCount++;
            if (ordersCreatedCount % 100 === 0) process.stdout.write(` ${ordersCreatedCount}`);

        } catch (e) {
            // Ignore stock errors etc
            // console.error(e.message);
        }
    }
    console.log(`\n   ✅ ${ordersCreatedCount} orders created and processed.`);


    // --- 7. Internal Stock Movements (Transfers) ---
    console.log('truck: Simulating Internal Stock Transfers...');
    for (let i = 0; i < 50; i++) {
        const p = pickRandom(sellableProducts);
        const fromLoc = pickRandom(locationIds);
        const toLoc = pickRandom(locationIds.filter(l => l !== fromLoc));

        try {
            await inventory.useCases.moveStock.execute(tenantId, {
                productId: p.id,
                fromLocationId: fromLoc,
                toLocationId: toLoc,
                quantity: 10,
                userId: managerUser.id,
                date: randomDate(stockBaseDate, endDate).toISOString()
            });
        } catch (e) { /* ignore insufficient stock */ }
    }
    console.log('   ✅ Transfers simulated.');

    // --- 8. Procurement & Manufacturing ---
    console.log('🏭 Seeding Procurement & Manufacturing...');

    // Suppliers
    const suppliers = [];
    for(let i=0; i<10; i++) {
        const s = await procurement.useCases.createSupplier.execute(tenantId, {
            name: `${pickRandom(LAST_NAMES)} Industries`,
            code: `SUP-${100+i}`,
            email: `supply${i}@example.com`
        });
        suppliers.push(s);
    }

    // Create some raw materials
    const rawMaterials = [];
    for(let i=0; i<20; i++) {
        const rm = await catalog.useCases.createProduct.execute(tenantId, {
            sku: `RM-${1000+i}`,
            name: `Raw Material ${i}`,
            price: 5.00,
            type: 'SIMPLE',
            category: 'Raw Materials'
        });
        rawMaterials.push(rm);
    }

    // Purchase Orders
    for(let i=0; i<20; i++) {
        const po = await procurement.useCases.createPurchaseOrder.execute(tenantId, {
            supplierId: pickRandom(suppliers).id,
            items: [{ productId: pickRandom(rawMaterials).id, quantity: 100, unitCost: 4.50 }],
            expectedDate: new Date().toISOString()
        });
    }

    console.log('   ✅ Procurement data created.');

    // --- 9. Manufacturing (BOMs & Work Orders) ---
    console.log('🔨 Seeding Manufacturing...');

    // Create a finished good that uses raw materials
    let tableProduct;
    try {
        tableProduct = await catalog.useCases.createProduct.execute(tenantId, {
            name: 'Industrial Work Table',
            sku: 'FG-TABLE-01',
            price: 150.00,
            type: 'SIMPLE',
            category: 'Furniture',
            status: 'ACTIVE'
        });
    } catch(e) { /* ignore */ }

    if (tableProduct && rawMaterials.length >= 3) {
        try {
            // BOM: 1 Table = 1 of RM-0, 2 of RM-1, 5 of RM-2
            const bom = await manufacturing.useCases.createBOM.execute(tenantId, {
                name: 'Standard Table BOM',
                productId: tableProduct.id,
                laborCost: 25.00,
                components: [
                    { productId: rawMaterials[0].id, quantity: 1 },
                    { productId: rawMaterials[1].id, quantity: 2 },
                    { productId: rawMaterials[2].id, quantity: 5 }
                ]
            });

            // Work Orders (Historical & Current)
            // Completed WO (Historical)
            await manufacturing.useCases.createWorkOrder.execute(tenantId, {
                bomId: bom.id,
                quantity: 10,
                startDate: new Date(Date.now() - 86400000 * 30).toISOString(), // 30 days ago
                status: 'COMPLETED'
            });

            // Pending WO
            await manufacturing.useCases.createWorkOrder.execute(tenantId, {
                bomId: bom.id,
                quantity: 5,
                startDate: new Date().toISOString()
            });
        } catch(e) { console.error('Manufacturing seed error:', e.message); }
    }
    console.log('   ✅ Manufacturing data created.');

    console.log('🎉 Seed Complete!');
    Deno.exit(0);
}

if (import.meta.main) {
    bootstrap().catch(e => {
        console.error(e);
        Deno.exit(1);
    });
}
