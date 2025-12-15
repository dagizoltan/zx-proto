import { createContextRegistry } from '@src/utils/registry/context-registry.js';
import { createConfigService } from '@src/utils/config/config-service.js';
import { createPersistenceContext } from '@src/infra/persistence/index.js';
import { createMessagingContext } from '@src/infra/messaging/index.js';
import { createSecurityContext } from '@src/infra/security/index.js';
import { createAccessControlContext } from '@src/ctx/access-control/index.js';
import { createInventoryContext } from '@src/ctx/inventory/index.js';
import { createOrdersContext } from '@src/ctx/orders/index.js';
import { createCatalogContext } from '@src/ctx/catalog/index.js';
import { createProcurementContext } from '@src/ctx/procurement/index.js';
import { createManufacturingContext } from '@src/ctx/manufacturing/index.js';
import { createSystemContext } from '@src/ctx/system/index.js';
import { createObservabilityContext } from '@src/ctx/observability/index.js';
import { createCommunicationContext } from '@src/ctx/communication/index.js';
import { createSchedulerContext } from '@src/ctx/scheduler/index.js';
import { createQueriesContext } from '@src/ctx/queries/index.js';

import { seedAccessControl } from './seeders/access-control-seeder.js';
import { seedCatalog } from './seeders/catalog-seeder.js';
import { seedInventory } from './seeders/inventory-seeder.js';
import { seedProcurement } from './seeders/procurement-seeder.js';
import { seedManufacturing } from './seeders/manufacturing-seeder.js';
import { seedOrders } from './seeders/order-seeder.js';
import { seedNotifications } from './seeders/notification-seeder.js';
import { seedCommunication } from './seeders/communication-seeder.js';
import { seedObservability } from './seeders/observability-seeder.js';
import { seedScheduler } from './seeders/scheduler-seeder.js';
import { Log } from './seeders/utils.js';

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
        .registerInfra('security', createSecurityContext, [])
        .registerDomain('observability', createObservabilityContext, ['infra.persistence', 'infra.messaging'])
        .registerDomain('access-control', createAccessControlContext, ['infra.persistence', 'domain.observability', 'infra.security', 'infra.messaging'])
        .registerDomain('inventory', createInventoryContext, ['infra.persistence', 'domain.observability', 'infra.messaging', 'domain.access-control'])
        .registerDomain('orders', createOrdersContext, ['infra.persistence', 'domain.observability', 'infra.messaging', 'domain.inventory', 'domain.access-control'])
        .registerDomain('catalog', createCatalogContext, ['infra.persistence', 'domain.observability', 'domain.inventory'])
        .registerDomain('procurement', createProcurementContext, ['infra.persistence', 'domain.inventory'])
        .registerDomain('manufacturing', createManufacturingContext, ['infra.persistence', 'domain.inventory'])
        .registerDomain('system', createSystemContext, ['infra.persistence', 'infra.messaging'])
        .registerDomain('communication', createCommunicationContext, ['infra.persistence', 'infra.messaging'])
        .registerDomain('scheduler', createSchedulerContext, ['infra.persistence', 'infra.messaging', 'domain.system'])
        .registerDomain('queries', createQueriesContext, ['domain.access-control', 'domain.orders']);

    await ctx.initialize(config);
    Log.success('Contexts initialized.');

    try {
        // 3. Run Seeders
        const { customers, allUsers } = await seedAccessControl(ctx, tenantId);

        const products = await seedCatalog(ctx, tenantId); // Includes Price Lists logic now
        const locationIds = await seedInventory(ctx, tenantId, products);
        await seedProcurement(ctx, tenantId, products, locationIds);
        await seedManufacturing(ctx, tenantId, products); // New seeder

        // Use allUsers for orders so Admin gets some orders too
        await seedOrders(ctx, tenantId, products, allUsers);

        // Use allUsers for system-wide things
        await seedNotifications(ctx, tenantId, allUsers);
        await seedCommunication(ctx, tenantId, allUsers);
        await seedObservability(ctx, tenantId, allUsers);
        await seedScheduler(ctx, tenantId);

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
