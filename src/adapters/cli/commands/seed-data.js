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
import { createSystemContext } from '../../../ctx/system/index.js';
import { createObservabilityContext } from '../../../ctx/observability/index.js';
import { createCommunicationContext } from '../../../ctx/communication/index.js';

import { seedAccessControl } from './seeders/access-control-seeder.js';
import { seedCatalog } from './seeders/catalog-seeder.js';
import { seedInventory } from './seeders/inventory-seeder.js';
import { seedProcurementAndManufacturing } from './seeders/procurement-seeder.js';
import { seedOrders } from './seeders/order-seeder.js';
import { seedCommunication } from './seeders/communication-seeder.js';
import { seedObservability } from './seeders/observability-seeder.js';
import { Log } from './seeders/utils.js';

async function bootstrap() {
  const environment = Deno.env.get('ENVIRONMENT') || 'local';
  const tenantId = Deno.args[0] || 'default';

  Log.step(`🌱 Seeding data for tenant: ${tenantId} in ${environment} mode...`);

  const config = await createConfigService(environment);
  const ctx = createContextRegistry();

  // Register contexts
  ctx
    .registerInfra('persistence', createPersistenceContext, [])
    .registerInfra('messaging', createMessagingContext, ['infra.persistence'])
    .registerInfra('obs', createObsContext, ['infra.persistence', 'infra.messaging'])
    .registerInfra('security', createSecurityContext, [])
    .registerInfra('realtime', createRealtimeContext, ['infra.messaging'])
    .registerDomain('access-control', createAccessControlContext, ['infra.persistence', 'infra.obs', 'infra.security', 'infra.messaging'])
    .registerDomain('inventory', createInventoryContext, ['infra.persistence', 'infra.obs', 'infra.messaging', 'domain.access-control'])
    .registerDomain('orders', createOrdersContext, ['infra.persistence', 'infra.obs', 'infra.messaging', 'domain.inventory', 'domain.access-control'])
    .registerDomain('catalog', createCatalogContext, ['infra.persistence', 'infra.obs', 'domain.inventory'])
    .registerDomain('procurement', createProcurementContext, ['infra.persistence', 'domain.inventory'])
    .registerDomain('manufacturing', createManufacturingContext, ['infra.persistence', 'domain.inventory'])
    .registerDomain('system', createSystemContext, ['infra.persistence', 'infra.messaging'])
    .registerDomain('observability', createObservabilityContext, ['infra.persistence'])
    .registerDomain('communication', createCommunicationContext, ['infra.persistence', 'infra.messaging']);

  await ctx.initialize(config);
  const persistence = ctx.get('infra.persistence');

  // --- 0. Clean Database ---
  Log.step('Cleaning Database...');
  await persistence.kvPool.withConnection(async (kv) => {
      const iter = kv.list({ prefix: ['tenants', tenantId] });
      let deleted = 0;
      for await (const res of iter) {
          await kv.delete(res.key);
          deleted++;
      }
      Log.success(`Deleted ${deleted} keys.`);
  });

  // --- Execution Pipeline ---
  const { customers } = await seedAccessControl(ctx, tenantId);
  const products = await seedCatalog(ctx, tenantId);
  const locationIds = await seedInventory(ctx, tenantId, products);
  await seedProcurementAndManufacturing(ctx, tenantId, locationIds);
  await seedOrders(ctx, tenantId, products, customers);

  // New Seeders
  await seedCommunication(tenantId, ctx.get('domain.communication').useCases);
  await seedObservability(tenantId, { obs: ctx.get('infra.obs') });

  Log.step('🎉 Enterprise Seeding Complete!');
  Deno.exit(0);
}

if (import.meta.main) {
  bootstrap().catch(e => {
      console.error(e);
      Deno.exit(1);
  });
}
