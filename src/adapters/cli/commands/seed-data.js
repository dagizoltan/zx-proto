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

// --- Constants & Config ---
const TENANT_ID = Deno.args[0] || 'default';
const TARGET_PRODUCTS = 1000;
const TARGET_ORDERS = 5000;
const HISTORY_DAYS = 180;
const START_DATE = new Date();
START_DATE.setDate(START_DATE.getDate() - HISTORY_DAYS);

// --- Helpers ---
const log = (msg) => console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// Electronics / Assembly Theme Data
const CATEGORIES = {
  'Processors': ['CPU', 'NPU', 'Microcontrollers'],
  'Graphics': ['Gaming GPU', 'Workstation GPU'],
  'Memory': ['DDR4', 'DDR5', 'SO-DIMM'],
  'Storage': ['NVMe SSD', 'SATA SSD', 'HDD'],
  'Motherboards': ['ATX', 'Micro-ATX', 'Mini-ITX'],
  'Cases': ['Full Tower', 'Mid Tower', 'Mini Tower'],
  'Power Supplies': ['650W', '850W', '1000W'],
  'Cooling': ['Air Coolers', 'AIO Liquid', 'Thermal Paste'],
  'Cables': ['HDMI', 'DisplayPort', 'USB-C', 'Ethernet'],
  'Assembly Tools': ['Screwdrivers', 'Soldering Irons', 'Anti-static Mats']
};

const BRANDS = ['Nexus', 'HyperCore', 'SiliconWafer', 'GigaTech', 'Quantum', 'Velocity', 'ArcticFlow', 'PowerGrid', 'CircuitMaster'];
const ADJECTIVES = ['Pro', 'Elite', 'Ultra', 'Gaming', 'Extreme', 'Silent', 'Compact', 'Industrial', 'RGB'];

function generateProductData(category, subcategory) {
    const brand = randomElement(BRANDS);
    const adj = randomElement(ADJECTIVES);
    const modelNum = randomInt(100, 9000);
    const suffix = randomElement(['X', 'Ti', 'Super', 'V2', 'Max']);

    const name = `${brand} ${subcategory} ${modelNum}${suffix} ${adj}`;
    const sku = `${brand.substring(0,3).toUpperCase()}-${subcategory.substring(0,3).toUpperCase()}-${modelNum}-${suffix}`;

    // Realistic-ish pricing logic
    let basePrice = 50;
    if (category === 'Processors') basePrice = 300;
    if (category === 'Graphics') basePrice = 600;
    if (category === 'Memory') basePrice = 100;
    if (category === 'Storage') basePrice = 80;
    if (category === 'Cables') basePrice = 15;
    if (category === 'Assembly Tools') basePrice = 40;

    const price = +(basePrice * (0.8 + Math.random() * 1.5)).toFixed(2);

    return { name, sku, price, description: `High performance ${subcategory} for demanding applications.`, type: 'SIMPLE' };
}

// --- Main Seeder Class ---
class Seeder {
    constructor(ctx, tenantId) {
        this.ctx = ctx;
        this.tenantId = tenantId;
        this.repo = ctx.get('infra.persistence').kvPool;

        // Contexts
        this.ac = ctx.get('domain.accessControl');
        this.inv = ctx.get('domain.inventory');
        this.cat = ctx.get('domain.catalog');
        this.ord = ctx.get('domain.orders');
        this.proc = ctx.get('domain.procurement');
        this.mfg = ctx.get('domain.manufacturing');

        // State
        this.adminUser = null;
        this.users = [];
        this.products = [];
        this.warehouses = [];
        this.locations = [];
        this.suppliers = [];
    }

    async clean() {
        log('🧹 Cleaning database...');
        await this.repo.withConnection(async (kv) => {
            const iter = kv.list({ prefix: ['tenants', this.tenantId] });
            let count = 0;
            for await (const res of iter) {
                await kv.delete(res.key);
                count++;
            }
            log(`   Deleted ${count} records.`);
        });
    }

    async seedRolesAndUsers() {
        log('🛡️  Seeding Access Control...');

        // Roles
        const rAdmin = await this.ac.useCases.createRole.execute(this.tenantId, { name: 'admin', permissions: [{ resource: '*', action: '*' }] });
        const rManager = await this.ac.useCases.createRole.execute(this.tenantId, { name: 'manager', permissions: [{ resource: '*', action: '*' }] }); // Simplified
        const rCustomer = await this.ac.useCases.createRole.execute(this.tenantId, { name: 'customer', permissions: [{ resource: 'products', action: 'read' }] });

        // Admin
        this.adminUser = await this.ac.useCases.registerUser.execute(this.tenantId, { email: 'admin@imsshop.com', password: 'password123', name: 'System Admin' });
        await this.ac.useCases.assignRole.execute(this.tenantId, { userId: this.adminUser.id, roleIds: [rAdmin.id] });

        // Manager
        const manager = await this.ac.useCases.registerUser.execute(this.tenantId, { email: 'manager@imsshop.com', password: 'password123', name: 'Store Manager' });
        await this.ac.useCases.assignRole.execute(this.tenantId, { userId: manager.id, roleIds: [rManager.id] });

        // Customers
        const firstNames = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

        for (let i = 0; i < 50; i++) {
            const fn = randomElement(firstNames);
            const ln = randomElement(lastNames);
            const name = `${fn} ${ln}`;
            const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${randomInt(1,999)}@example.com`;

            try {
                const u = await this.ac.useCases.registerUser.execute(this.tenantId, { email, password: 'password123', name });
                await this.ac.useCases.assignRole.execute(this.tenantId, { userId: u.id, roleIds: [rCustomer.id] });
                this.users.push(u);
            } catch(e) { /* ignore dupes */ }
        }
        log(`   Created ${this.users.length + 2} users.`);
    }

    async seedInventoryStructure() {
        log('🏭 Seeding Warehouses...');
        const wh1 = await this.inv.useCases.createWarehouse.execute(this.tenantId, { name: 'Central Assembly Hub', code: 'WH-MAIN' });
        const wh2 = await this.inv.useCases.createWarehouse.execute(this.tenantId, { name: 'Regional Components Depot', code: 'WH-EAST' });
        this.warehouses.push(wh1, wh2);

        // Locations
        const createLocs = async (wh) => {
            const zone = await this.inv.useCases.createLocation.execute(this.tenantId, { warehouseId: wh.id, code: 'Z1', type: 'ZONE' });
            for(let i=1; i<=5; i++) {
                const aisle = await this.inv.useCases.createLocation.execute(this.tenantId, { warehouseId: wh.id, parentId: zone.id, code: `A${i}`, type: 'AISLE' });
                this.locations.push(aisle.id);
            }
        };

        await createLocs(wh1);
        await createLocs(wh2);
    }

    async seedCatalog() {
        log('📦 Seeding Catalog...');
        const categoryMap = {}; // name -> id

        for (const [catName, subs] of Object.entries(CATEGORIES)) {
            const c = await this.cat.useCases.createCategory.execute(this.tenantId, { name: catName, description: `All ${catName}` });
            categoryMap[catName] = c.id;

            for (const sub of subs) {
                // Just create products directly mapped to parent category for simplicity in logic, or create sub-cats
                // Let's create sub-cats
                await this.cat.useCases.createCategory.execute(this.tenantId, { name: sub, parentId: c.id });
            }
        }

        // Generate Products
        let count = 0;
        const targetPerCategory = Math.ceil(TARGET_PRODUCTS / Object.keys(CATEGORIES).length);

        for (const [catName, subs] of Object.entries(CATEGORIES)) {
            for (let i=0; i < targetPerCategory; i++) {
                const sub = randomElement(subs);
                const data = generateProductData(catName, sub);
                // Ensure unique SKU
                data.sku = `${data.sku}-${randomInt(1000,9999)}`;
                data.category = catName;

                try {
                    const p = await this.cat.useCases.createProduct.execute(this.tenantId, data);
                    this.products.push(p);
                    count++;
                } catch(e) {}
            }
            process.stdout.write('.');
        }
        console.log('');
        log(`   Created ${this.products.length} products.`);
    }

    async seedSuppliers() {
        log('🚚 Seeding Suppliers...');
        const names = ['TechSupply Global', 'Component Direct', 'Shenzhen Electronics', 'US Chipworks', 'MegaParts Ltd'];
        for (const name of names) {
            const s = await this.proc.useCases.createSupplier.execute(this.tenantId, { name, code: name.substring(0,4).toUpperCase(), email: 'orders@test.com' });
            this.suppliers.push(s);
        }
    }

    async simulateHistory() {
        log(`📅 Simulating History (${HISTORY_DAYS} days)...`);

        // Initial Stock (Day 0)
        log('   Receiving initial stock...');
        const initialDate = new Date(START_DATE);

        // 80% of products get stock initially
        for (const p of this.products) {
            if (Math.random() > 0.2) {
                const loc = randomElement(this.locations);
                const qty = randomInt(50, 500);
                await this.inv.useCases.receiveStock.execute(this.tenantId, {
                    productId: p.id,
                    locationId: loc,
                    quantity: qty,
                    reason: 'Opening Balance',
                    userId: this.adminUser.id,
                    date: initialDate.toISOString()
                });
            }
        }

        // Daily Loop
        let currentDate = new Date(START_DATE);
        const endDate = new Date();
        const totalDays = HISTORY_DAYS;
        let dayCount = 0;

        // Curve for orders: Starts low, grows quadratic
        const getDailyOrderCount = (day) => {
             const progress = day / totalDays;
             const base = (TARGET_ORDERS / totalDays) * 2 * progress; // Linear growth approximation
             return Math.max(1, Math.floor(base * (0.5 + Math.random())));
        };

        while (currentDate <= endDate) {
            const isoDate = currentDate.toISOString();
            dayCount++;

            // 1. Restock (Randomly)
            if (Math.random() > 0.7) {
                const p = randomElement(this.products);
                const loc = randomElement(this.locations);
                await this.inv.useCases.receiveStock.execute(this.tenantId, {
                    productId: p.id, locationId: loc, quantity: randomInt(20, 100),
                    reason: 'Restock', userId: this.adminUser.id, date: isoDate
                });
            }

            // 2. Adjustments / Movements (Daily Ops)
            if (Math.random() > 0.8) {
                 // Move
                 const p = randomElement(this.products);
                 const from = randomElement(this.locations);
                 const to = randomElement(this.locations);
                 if (from !== to) {
                     try {
                        await this.inv.useCases.moveStock.execute(this.tenantId, {
                            productId: p.id, fromLocationId: from, toLocationId: to, quantity: randomInt(1, 10),
                            userId: this.adminUser.id, date: isoDate
                        });
                     } catch(e) {}
                 }
            }

            // 3. Create Orders
            const dailyOrders = getDailyOrderCount(dayCount);
            for (let i=0; i<dailyOrders; i++) {
                if (this.users.length === 0) break;
                const buyer = randomElement(this.users);

                // Build Cart
                const itemCount = randomInt(1, 5);
                const items = [];
                for(let k=0; k<itemCount; k++) {
                    const p = randomElement(this.products);
                    items.push({ productId: p.id, quantity: randomInt(1, 3) });
                }

                try {
                    // Create Order
                    const order = await this.ord.useCases.createOrder.execute(this.tenantId, buyer.id, items, isoDate);

                    // Decide Lifecycle based on how old the order is
                    const ageDays = (endDate - currentDate) / (1000 * 60 * 60 * 24);

                    if (ageDays > 30) {
                        // Old orders: Mostly Delivered (90%), Cancelled (5%), Shipped (5%) ?? No, shipped implies not delivered yet?
                        // Let's say 95% Delivered.
                        await this.fulfillOrder(order, currentDate, 'DELIVERED');
                    } else if (ageDays > 5) {
                        // Recent past: Mostly Shipped or Delivered
                        await this.fulfillOrder(order, currentDate, Math.random() > 0.5 ? 'DELIVERED' : 'SHIPPED');
                    } else {
                        // Very recent: Created, maybe Shipped
                        if (Math.random() > 0.5) {
                            await this.fulfillOrder(order, currentDate, 'SHIPPED');
                        }
                    }

                } catch(e) {
                    // Stockout likely, ignore
                }
            }

            if (dayCount % 10 === 0) process.stdout.write(`Day ${dayCount}/${totalDays} `);

            currentDate.setDate(currentDate.getDate() + 1);
        }
        console.log('');
    }

    async fulfillOrder(order, orderDate, targetStatus) {
        // Delay for shipment
        const shipDate = new Date(orderDate);
        shipDate.setHours(shipDate.getHours() + randomInt(4, 48));

        if (targetStatus === 'CANCELLED') {
             // Not implemented in simple logic yet without dedicated use case exposing state change
             // But we can just leave it if we want.
             return;
        }

        if (targetStatus === 'SHIPPED' || targetStatus === 'DELIVERED') {
            try {
                const shipment = await this.ord.useCases.createShipment.execute(this.tenantId, {
                    orderId: order.id,
                    items: order.items, // Full ship
                    carrier: randomElement(['UPS', 'FedEx', 'DHL']),
                    trackingNumber: `1Z${randomInt(10000000,99999999)}`,
                }, shipDate.toISOString());

                if (targetStatus === 'DELIVERED') {
                    // Manually update order status to DELIVERED as we don't have a "deliver" use case usually
                    // or we check if there's one. The 'createShipment' sets it to SHIPPED.
                    // We will hack the repo to set it to DELIVERED for realism.
                    const repo = this.ord.repositories.order;
                    const o = await repo.findById(this.tenantId, order.id);
                    o.status = 'DELIVERED';
                    // o.deliveredAt = ...
                    await repo.save(this.tenantId, o);
                }
            } catch(e) {
                // console.log('Ship fail', e.message);
            }
        }
    }
}

async function bootstrap() {
    const environment = Deno.env.get('ENVIRONMENT') || 'local';

    console.log(`🌱 Seeding TENANT: ${TENANT_ID} | TARGET: ${TARGET_PRODUCTS} prods, ${TARGET_ORDERS} orders`);

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

    const seeder = new Seeder(ctx, TENANT_ID);

    await seeder.clean();
    await seeder.seedRolesAndUsers();
    await seeder.seedInventoryStructure();
    await seeder.seedSuppliers();
    await seeder.seedCatalog();
    await seeder.simulateHistory();

    log('🎉 Seeding Complete!');
    Deno.exit(0);
}

if (import.meta.main) {
    bootstrap().catch(e => {
        console.error(e);
        Deno.exit(1);
    });
}
