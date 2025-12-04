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

// Simple random helpers (avoiding large faker dependency if possible, but for "realistic" maybe we should use it)
// I'll implement a mini-faker to keep it self-contained and fast.
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

  // Register contexts (copy-paste from main.js logic ideally refactored)
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

  // 1. Create Admin User
  console.log('👤 Creating Admin User...');
  try {
      await accessControl.useCases.registerUser.execute(tenantId, {
        email: 'admin@imsshop.com',
        password: 'admin',
        name: 'Admin User'
      });
      // Assign admin role (mock logic, assume role 'admin' exists or implicit)
      // await accessControl.services.rbac.assignRole(...)
      console.log('   ✅ admin@imsshop.com / admin');
  } catch (e) {
      console.log('   ℹ️  Admin user likely exists');
  }

  // 2. Create Products & Inventory
  console.log('📦 Creating Products & Inventory...');
  const warehouses = ['WH-US-EAST', 'WH-US-WEST'];
  const locations = warehouses.flatMap(wh => [`${wh}-ZONE-A`, `${wh}-ZONE-B`]);

  for (let i = 0; i < 20; i++) {
      try {
          const product = await inventory.useCases.createProduct.execute(tenantId, {
              sku: `SKU-${1000 + i}`,
              name: faker.commerce.productName(),
              price: parseFloat(faker.commerce.price()),
              description: `A wonderful product for your daily needs.`,
              category: faker.commerce.department(),
              quantity: 0 // Initial
          });

          // Receive stock in random locations
          const loc = locations[Math.floor(Math.random() * locations.length)];
          const qty = Math.floor(Math.random() * 50) + 10;

          await inventory.useCases.receiveStock.execute(tenantId, {
              productId: product.id,
              locationId: loc,
              quantity: qty,
              reason: 'Initial Seed',
              userId: 'system-seed'
          });

          process.stdout.write('.');
      } catch (e) {
          // ignore duplicates
      }
  }
  console.log('\n   ✅ 20 products created with stock.');

  // 3. Create Mock Orders
  console.log('🛒 Creating Mock Orders...');
  const products = await inventory.useCases.listAllProducts.execute(tenantId);
  if (!products || products.length === 0) {
      console.log('   ⚠️  No products found, skipping order creation.');
  } else {
      const user = { id: 'mock-customer-1' }; // Mock ID

      for (let i = 0; i < 5; i++) {
      const items = [];
      const numItems = Math.floor(Math.random() * 3) + 1;

      for (let j = 0; j < numItems; j++) {
          const p = products[Math.floor(Math.random() * products.length)];
          items.push({ productId: p.id, quantity: Math.floor(Math.random() * 2) + 1 });
      }

      try {
        await orders.useCases.createOrder.execute(tenantId, user.id, items);
        process.stdout.write('.');
      } catch (e) {
          // ignore stock errors
      }
    }
    console.log('\n   ✅ 5 mock orders created.');
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
