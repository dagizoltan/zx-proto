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

// Simple random helpers
const faker = {
  internet: {
    email: (name) => `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
  },
  person: {
    fullName: () => {
      const firsts = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth'];
      const lasts = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
      return `${firsts[Math.floor(Math.random() * firsts.length)]} ${lasts[Math.floor(Math.random() * lasts.length)]}`;
    }
  },
  commerce: {
    productName: () => {
      const adjs = ['Small', 'Ergonomic', 'Rustic', 'Intelligent', 'Gorgeous', 'Incredible', 'Fantastic', 'Practical', 'Sleek', 'Awesome'];
      const materials = ['Steel', 'Wooden', 'Concrete', 'Plastic', 'Cotton', 'Granite', 'Rubber', 'Metal', 'Soft', 'Fresh'];
      const products = ['Chair', 'Car', 'Computer', 'Keyboard', 'Mouse', 'Bike', 'Ball', 'Gloves', 'Pants', 'Shirt', 'Table', 'Shoes', 'Hat', 'Towels', 'Soap', 'Tuna', 'Chicken', 'Fish', 'Cheese', 'Bacon', 'Pizza', 'Salad', 'Sausages', 'Chips'];
      return `${adjs[Math.floor(Math.random() * adjs.length)]} ${materials[Math.floor(Math.random() * materials.length)]} ${products[Math.floor(Math.random() * products.length)]}`;
    },
    price: () => (Math.random() * 100 + 10).toFixed(2),
    department: () => {
      const depts = ['Electronics', 'Clothing', 'Home', 'Garden', 'Toys', 'Books', 'Sports'];
      return depts[Math.floor(Math.random() * depts.length)];
    }
  }
};

async function bootstrap() {
  const environment = Deno.env.get('ENVIRONMENT') || 'local';
  const tenantId = Deno.args[0] || 'default';

  console.log(`🌱 Seeding data for tenant: ${tenantId} in ${environment} mode...`);

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

  const accessControl = ctx.get('domain.accessControl');
  const inventory = ctx.get('domain.inventory');
  const orders = ctx.get('domain.orders');
  const catalog = ctx.get('domain.catalog');
  const procurement = ctx.get('domain.procurement');
  const manufacturing = ctx.get('domain.manufacturing');

  // --- 1. RBAC (Roles & Users) ---
  console.log('🛡️  Seeding Roles & Users...');

  // Create Roles
  const roles = {
      admin: null,
      manager: null,
      customer: null
  };

  try {
      roles.admin = await accessControl.useCases.createRole.execute(tenantId, {
          name: 'admin',
          permissions: [{ resource: '*', action: '*' }]
      });
      console.log('   ✅ Role: admin created');
  } catch(e) { /* existing */ }

  try {
      roles.manager = await accessControl.useCases.createRole.execute(tenantId, {
          name: 'manager',
          permissions: [{ resource: 'products', action: '*' }, { resource: 'orders', action: 'read' }]
      });
      console.log('   ✅ Role: manager created');
  } catch(e) { /* existing */ }

  try {
      roles.customer = await accessControl.useCases.createRole.execute(tenantId, {
          name: 'customer',
          permissions: [{ resource: 'products', action: 'read' }]
      });
      console.log('   ✅ Role: customer created');
  } catch(e) { /* existing */ }

  // Fallback if roles already existed, fetch them (need a findByName ideally, but for now we iterate or just proceed)
  const allRoles = await accessControl.useCases.listRoles.execute(tenantId);
  const getRoleId = (name) => allRoles.find(r => r.name === name)?.id;

  const adminRoleId = getRoleId('admin');
  const managerRoleId = getRoleId('manager');
  const customerRoleId = getRoleId('customer');

  // Create Users
  const seedUser = async (email, name, roleId) => {
      try {
          const user = await accessControl.useCases.registerUser.execute(tenantId, { email, password: 'password123', name });
          if (roleId) {
              await accessControl.useCases.assignRole.execute(tenantId, { userId: user.id, roleIds: [roleId] });
          }
          console.log(`   ✅ User: ${email} created`);
          return user;
      } catch (e) {
          console.log(`   ℹ️  User: ${email} exists, skipped`);
          const existing = await accessControl.repositories.user.findByEmail(tenantId, email);
          if (existing && roleId) {
             await accessControl.useCases.assignRole.execute(tenantId, { userId: existing.id, roleIds: [roleId] });
          }
          return existing;
      }
  };

  const adminUser = await seedUser('admin@imsshop.com', 'Super Admin', adminRoleId);
  await seedUser('manager@imsshop.com', 'Store Manager', managerRoleId);
  const customerUser = await seedUser('customer@imsshop.com', 'Regular Customer', customerRoleId);

  // Seed a few more random customers
  for(let i=0; i<5; i++) {
      await seedUser(faker.internet.email(faker.person.fullName()), faker.person.fullName(), customerRoleId);
  }

  // --- 2. Warehouses & Locations ---
  console.log('🏭 Seeding Warehouses & Locations...');

  const createdLocations = [];

  // Seed Warehouses
  const warehouses = [
      { name: 'Main Warehouse', code: 'WH-01' },
      { name: 'East Coast Distribution', code: 'WH-02' }
  ];

  for (const wData of warehouses) {
      let warehouse;
      try {
          // Naive check via repository if findByName exists, else create
          // For seed, just create and ignore error? Or better, implement findByName in repo?
          // Repository findAll works.
          const allWh = await inventory.repositories.warehouse.findAll(tenantId);
          warehouse = allWh.find(w => w.code === wData.code);

          if (!warehouse) {
              warehouse = await inventory.useCases.createWarehouse.execute(tenantId, wData);
              console.log(`   ✅ Warehouse: ${wData.name} created`);
          } else {
              console.log(`   ℹ️  Warehouse: ${wData.name} exists`);
          }

          // Create Locations (Zones)
          const zones = ['Zone A', 'Zone B'];
          for (const zName of zones) {
              const allLocs = await inventory.repositories.location.findByWarehouseId(tenantId, warehouse.id);
              let zone = allLocs.find(l => l.code === zName && l.type === 'ZONE');

              if (!zone) {
                  zone = await inventory.useCases.createLocation.execute(tenantId, {
                      warehouseId: warehouse.id,
                      code: zName,
                      type: 'ZONE'
                  });
              }
              createdLocations.push(zone.id);

              // Create Aisles
              for (let i = 1; i <= 3; i++) {
                  const aisleCode = `${zName}-Aisle-${i}`;
                  let aisle = allLocs.find(l => l.code === aisleCode);
                  if (!aisle) {
                      aisle = await inventory.useCases.createLocation.execute(tenantId, {
                          warehouseId: warehouse.id,
                          parentId: zone.id,
                          code: aisleCode,
                          type: 'AISLE'
                      });
                  }
                  createdLocations.push(aisle.id);
              }
          }

      } catch (e) { console.error(e); }
  }

  // --- 3. Products & Variants (Catalog) ---
  console.log('📦 Creating Products & Variants...');

  // Create Configurable Product (T-Shirt)
  let tshirtParent;
  try {
      // Force creation of new V2 to ensure updated schema
      tshirtParent = await catalog.useCases.createProduct.execute(tenantId, {
          sku: 'TSHIRT-CLASSIC-V2',
          name: 'Classic Cotton T-Shirt V2',
          description: 'A comfortable classic t-shirt in various colors.',
          price: 20.00,
          type: 'CONFIGURABLE',
          configurableAttributes: ['color', 'size'],
          category: 'Clothing'
      });
      console.log('   ✅ Product: Classic T-Shirt (Configurable) created');
  } catch (e) {
      // Need a way to find it if it failed
      const all = await catalog.useCases.listProducts.execute(tenantId);
      tshirtParent = all.find(p => p.sku === 'TSHIRT-CLASSIC-V2');
      console.log('   ℹ️  Product: Classic T-Shirt V2 exists');
  }

  if (tshirtParent) {
      const variants = [
          { color: 'Red', size: 'M', sku: 'TSHIRT-RED-M' },
          { color: 'Blue', size: 'L', sku: 'TSHIRT-BLUE-L' },
          { color: 'Green', size: 'S', sku: 'TSHIRT-GREEN-S' }
      ];

      for (const v of variants) {
          try {
              const vProduct = await catalog.useCases.createProduct.execute(tenantId, {
                  sku: v.sku,
                  name: `Classic T-Shirt - ${v.color} (${v.size})`,
                  price: 20.00,
                  type: 'VARIANT',
                  parentId: tshirtParent.id,
                  variantAttributes: { color: v.color, size: v.size },
                  category: 'Clothing'
              });
              console.log(`   ✅ Variant: ${v.sku} created`);

              // Seed Stock for Variant
              if (createdLocations.length > 0) {
                  const loc = createdLocations[Math.floor(Math.random() * createdLocations.length)];
                  await inventory.useCases.receiveStock.execute(tenantId, {
                      productId: vProduct.id,
                      locationId: loc,
                      quantity: 50,
                      reason: 'Initial Seed',
                      userId: adminUser?.id || 'system'
                  });
              }
          } catch (e) { console.error('Failed to create variant:', e); }
      }
  }

  // Random Products
  for (let i = 0; i < 10; i++) {
      try {
          const product = await catalog.useCases.createProduct.execute(tenantId, {
              sku: `SKU-${1000 + i}`,
              name: faker.commerce.productName(),
              price: parseFloat(faker.commerce.price()),
              description: `A wonderful product for your daily needs.`,
              category: faker.commerce.department(),
              type: 'SIMPLE',
              status: Math.random() > 0.1 ? 'ACTIVE' : 'INACTIVE'
          });

          const loc = createdLocations[Math.floor(Math.random() * createdLocations.length)];
          const qty = Math.floor(Math.random() * 50) + 10;

          await inventory.useCases.receiveStock.execute(tenantId, {
              productId: product.id,
              locationId: loc,
              quantity: qty,
              reason: 'Initial Seed',
              userId: adminUser?.id || 'system'
          });

          process.stdout.write('.');
      } catch (e) { }
  }
  console.log(`\n   ✅ Random products created.`);

  // --- 4. Mock Orders ---
  console.log('🛒 Creating Mock Orders...');
  // Use catalog listing
  const products = await catalog.useCases.listProducts.execute(tenantId, 1, 100); // Pagination assumed

  if (products && products.length > 0) {
      // Get some customers
      const { items: customers } = await accessControl.useCases.listUsers.execute(tenantId, { limit: 50 });
      const customerUsers = customers.filter(c => c.email !== 'admin@imsshop.com' && c.email !== 'manager@imsshop.com');

      if (customerUsers.length > 0) {
          for (let i = 0; i < 15; i++) {
              const buyer = customerUsers[Math.floor(Math.random() * customerUsers.length)];
              const items = [];
              const numItems = Math.floor(Math.random() * 3) + 1;

              for (let j = 0; j < numItems; j++) {
                  const p = products[Math.floor(Math.random() * products.length)];
                  // Ensure stock exists? createOrder checks.
                  items.push({ productId: p.id, quantity: 1 }); // Simple quantity
              }

              try {
                await orders.useCases.createOrder.execute(tenantId, buyer.id, items);
                process.stdout.write('.');
              } catch (e) { }
          }
          console.log('\n   ✅ Mock orders created.');
      }
  }

    // --- 5. Procurement & Manufacturing ---
    console.log('🏭 Seeding Procurement & Manufacturing...');

    const suppliersData = [
      { name: 'Global Steel Co', code: 'SUP-STEEL', email: 'orders@globalsteel.com' },
      { name: 'WoodWorks Inc', code: 'SUP-WOOD', email: 'sales@woodworks.com' },
      { name: 'FastParts Ltd', code: 'SUP-PARTS', email: 'contact@fastparts.com' }
    ];

    const suppliers = [];
    for (const s of suppliersData) {
        try {
            // Naive dupe check
            const existing = (await procurement.useCases.listSuppliers.execute(tenantId)).items.find(x => x.code === s.code);
            if(!existing) {
                const created = await procurement.useCases.createSupplier.execute(tenantId, s);
                suppliers.push(created);
                console.log(`   ✅ Supplier: ${s.name} created`);
            } else {
                suppliers.push(existing);
            }
        } catch(e) { console.error(e); }
    }

    // Raw Materials
    const rawMaterialsData = [
        { name: 'Steel Sheet 4x8', sku: 'RM-STEEL-01', price: 50.00 },
        { name: 'Pine Plank 2x4', sku: 'RM-WOOD-01', price: 8.50 },
        { name: 'Industrial Screw', sku: 'RM-SCREW-01', price: 0.10 }
    ];

    const rawMaterials = [];
    for (const p of rawMaterialsData) {
        try {
            const created = await catalog.useCases.createProduct.execute(tenantId, {
                ...p,
                type: 'SIMPLE',
                category: 'Raw Materials'
            });
            rawMaterials.push(created);
            console.log(`   ✅ Raw Material: ${p.name} created`);
        } catch(e) {
           // If fails (duplicate SKU), try to fetch
           const all = await catalog.useCases.listProducts.execute(tenantId, 1, 100);
           const existing = all.find(x => x.sku === p.sku);
           if(existing) rawMaterials.push(existing);
        }
    }

    // Create PO
    if (suppliers.length > 0 && rawMaterials.length > 0) {
        try {
            const po = await procurement.useCases.createPurchaseOrder.execute(tenantId, {
                supplierId: suppliers[0].id,
                items: [
                    { productId: rawMaterials[0].id, quantity: 100, unitCost: 45.00 }, // Bulk discount
                    { productId: rawMaterials[2].id, quantity: 1000, unitCost: 0.08 }
                ],
                expectedDate: new Date(Date.now() + 86400000 * 7).toISOString()
            });
            console.log(`   ✅ PO created: ${po.code}`);

            // Receive it partially
            const defaultLoc = createdLocations[0];
            if(defaultLoc) {
               await procurement.useCases.receivePurchaseOrder.execute(tenantId, po.id, {
                   locationId: defaultLoc,
                   items: [{ productId: rawMaterials[0].id, quantity: 50 }]
               });
               console.log(`   ✅ PO Received (Partial)`);
            }
        } catch(e) { console.error('PO Error:', e); }
    }

    // Manufacturing
    // Finished Good
    let tableProduct;
    try {
        tableProduct = await catalog.useCases.createProduct.execute(tenantId, {
            name: 'Industrial Work Table',
            sku: 'FG-TABLE-01',
            price: 150.00,
            type: 'SIMPLE', // Or should be manufactured type? standard Simple works for now
            category: 'Furniture'
        });
    } catch(e) {
        const all = await catalog.useCases.listProducts.execute(tenantId, 1, 100);
        tableProduct = all.find(x => x.sku === 'FG-TABLE-01');
    }

    if (tableProduct && rawMaterials.length >= 3) {
        try {
            // BOM: 1 Table = 1 Steel Sheet + 2 Wood Planks + 10 Screws
            const bom = await manufacturing.useCases.createBOM.execute(tenantId, {
                name: 'Standard Table BOM',
                productId: tableProduct.id,
                laborCost: 25.00,
                components: [
                    { productId: rawMaterials[0].id, quantity: 1 },
                    { productId: rawMaterials[1].id, quantity: 2 },
                    { productId: rawMaterials[2].id, quantity: 10 }
                ]
            });
            console.log(`   ✅ BOM created for ${tableProduct.name}`);

            // Work Order
            const wo = await manufacturing.useCases.createWorkOrder.execute(tenantId, {
                bomId: bom.id,
                quantity: 5,
                startDate: new Date().toISOString()
            });
            console.log(`   ✅ Work Order created: ${wo.code}`);
        } catch(e) { console.error('Manufacturing Seed Error:', e); }
    }

  console.log('🎉 Seeding complete!');
  Deno.exit(0);
}

if (import.meta.main) {
  bootstrap().catch(e => {
      console.error(e);
      Deno.exit(1);
  });
}
