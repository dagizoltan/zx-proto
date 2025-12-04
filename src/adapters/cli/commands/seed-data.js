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
    .registerDomain('catalog', createCatalogContext, ['infra.persistence', 'infra.obs', 'domain.inventory']);

  await ctx.initialize(config);

  const accessControl = ctx.get('domain.accessControl');
  const inventory = ctx.get('domain.inventory');
  const orders = ctx.get('domain.orders');

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
  // To keep seed simple, we rely on them being created now or we can use listRoles to find IDs if needed.
  // For robustness, let's fetch all roles to get IDs.
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
          // If exists, we could try to find and assign role, but let's assume it's set
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

  // --- 2. Products & Inventory ---
  console.log('📦 Creating Products & Inventory...');
  const warehouses = ['WH-US-EAST', 'WH-US-WEST'];
  const locations = warehouses.flatMap(wh => [`${wh}-ZONE-A`, `${wh}-ZONE-B`]);

  const createdProducts = [];

  for (let i = 0; i < 20; i++) {
      try {
          const product = await inventory.useCases.createProduct.execute(tenantId, {
              sku: `SKU-${1000 + i}`,
              name: faker.commerce.productName(),
              price: parseFloat(faker.commerce.price()),
              description: `A wonderful product for your daily needs.`,
              category: faker.commerce.department(),
              quantity: 0,
              status: Math.random() > 0.1 ? 'ACTIVE' : 'INACTIVE'
          });

          createdProducts.push(product);

          const loc = locations[Math.floor(Math.random() * locations.length)];
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
  console.log(`\n   ✅ ${createdProducts.length} products created.`);

  // --- 3. Mock Orders ---
  console.log('🛒 Creating Mock Orders...');
  const result = await inventory.useCases.listAllProducts.execute(tenantId, { limit: 100 });
  let productList = result.items || result;

  if (productList && productList.length > 0) {
      // Get some customers
      const { items: customers } = await accessControl.useCases.listUsers.execute(tenantId, { limit: 50 });
      // Filter those who are just customers if possible, or use all
      const customerUsers = customers.filter(c => c.email !== 'admin@imsshop.com' && c.email !== 'manager@imsshop.com');

      if (customerUsers.length > 0) {
          for (let i = 0; i < 15; i++) {
              const buyer = customerUsers[Math.floor(Math.random() * customerUsers.length)];
              const items = [];
              const numItems = Math.floor(Math.random() * 3) + 1;

              for (let j = 0; j < numItems; j++) {
                  const p = productList[Math.floor(Math.random() * productList.length)];
                  items.push({ productId: p.id, quantity: Math.floor(Math.random() * 2) + 1 });
              }

              try {
                await orders.useCases.createOrder.execute(tenantId, buyer.id, items);
                process.stdout.write('.');
              } catch (e) { }
          }
          console.log('\n   ✅ Mock orders created.');
      }
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
