import { createContextRegistry } from '../../../../utils/registry/context-registry.js';
import { createConfigService } from '../../../../utils/config/config-service.js';
import { createPersistenceContext } from '../../../../infra/persistence/index.js';
import { createMessagingContext } from '../../../../infra/messaging/index.js';
import { createObsContext } from '../../../../infra/obs/index.js';
import { createSecurityContext } from '../../../../infra/security/index.js';
import { createAccessControlContext } from '../../../../ctx/access-control/index.js';
import { createInventoryContext } from '../../../../ctx/inventory/index.js';
import { createOrdersContext } from '../../../../ctx/orders/index.js';
import { createCatalogContext } from '../../../../ctx/catalog/index.js';
import { createProcurementContext } from '../../../../ctx/procurement/index.js';
import { createManufacturingContext } from '../../../../ctx/manufacturing/index.js';
import { createSystemContext } from '../../../../ctx/system/index.js';
import { createObservabilityContext } from '../../../../ctx/observability/index.js';
import { createCommunicationContext } from '../../../../ctx/communication/index.js';
import { createSchedulerContext } from '../../../../ctx/scheduler/index.js';
import { createQueriesContext } from '../../../../ctx/queries/index.js';

import { seedAccessControl } from './seeders/access-control-seeder.js';
import { seedCatalog } from './seeders/catalog-seeder.js';
import { seedInventory } from './seeders/inventory-seeder.js';
import { seedProcurement } from './seeders/procurement-seeder.js';
import { seedManufacturing } from './seeders/manufacturing-seeder.js';
import { seedOrders } from './seeders/order-seeder.js';
import { seedNotifications } from './seeders/notification-seeder.js';
import { seedCommunication } from './seeders/communication-seeder.js';
import { seedObservability } from './seeders/observability-seeder.js';
import { Log } from './seeders/utils.js';
import { DenoKV } from '../../../../infra/persistence/kv/deno-kv.js';

const run = async () => {
    console.log('🌱 Starting Database Seed...');
    const tenantId = 'default';

    // 1. Clean Database
    Log.step('Cleaning Database...');
    const kv = await Deno.openKv();
    const iter = kv.list({ prefix: ['tenants', tenantId] });
    let deletedCount = 0;
    for await (const entry of iter) {
        await kv.delete(entry.key);
        deletedCount++;
    }
    kv.close();
    Log.success(`Database cleaned (${deletedCount} entries removed).`);

    // 2. Initialize App Context (Partial)
    const config = await createConfigService('local'); // Force local for seed
    const ctx = createContextRegistry();

    // Wiring (Matches main.js)
    ctx
        .registerInfra('persistence', createPersistenceContext, [])
        .registerInfra('messaging', createMessagingContext, ['infra.persistence'])
        .registerInfra('obs', createObsContext, ['infra.persistence', 'infra.messaging'])
        .registerInfra('security', createSecurityContext, [])
        .registerDomain('access-control', createAccessControlContext, ['infra.persistence', 'infra.obs', 'infra.security', 'infra.messaging'])
        .registerDomain('inventory', createInventoryContext, ['infra.persistence', 'infra.obs', 'infra.messaging', 'domain.access-control'])
        .registerDomain('orders', createOrdersContext, ['infra.persistence', 'infra.obs', 'infra.messaging', 'domain.inventory', 'domain.access-control'])
        .registerDomain('catalog', createCatalogContext, ['infra.persistence', 'infra.obs', 'domain.inventory'])
        .registerDomain('procurement', createProcurementContext, ['infra.persistence', 'domain.inventory'])
        .registerDomain('manufacturing', createManufacturingContext, ['infra.persistence', 'domain.inventory'])
        .registerDomain('system', createSystemContext, ['infra.persistence', 'infra.messaging'])
        .registerDomain('observability', createObservabilityContext, ['infra.persistence'])
        .registerDomain('communication', createCommunicationContext, ['infra.persistence', 'infra.messaging'])
        .registerDomain('scheduler', createSchedulerContext, ['infra.persistence', 'infra.messaging', 'domain.system'])
        .registerDomain('queries', createQueriesContext, ['domain.access-control', 'domain.orders']);

    await ctx.initialize(config);
    Log.success('Contexts initialized.');

    try {
        // 3. Run Seeders
        const users = await seedAccessControl(ctx, tenantId);
        const products = await seedCatalog(ctx, tenantId); // Includes Price Lists logic now
        const warehouses = await seedInventory(ctx, tenantId, products);
        await seedProcurement(ctx, tenantId, products, warehouses);
        await seedManufacturing(ctx, tenantId, products); // New seeder
        await seedOrders(ctx, tenantId, products, users);
        await seedNotifications(ctx, tenantId, users);
        await seedCommunication(ctx, tenantId, users);
        await seedObservability(ctx, tenantId, users);

        Log.success('✅ All seeders completed successfully.');
    } catch (e) {
        console.error('❌ Seeding failed:', e);
    } finally {
        // Close resources
        // Some contexts might have open handles (KV, intervals).
        // Since we are running as a script, we can just exit.
        Deno.exit(0);
    }
};

if (import.meta.main) {
    run();
}
