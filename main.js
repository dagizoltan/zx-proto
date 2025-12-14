// main.js

import { createContextRegistry } from './src/utils/registry/context-registry.js';
import { createConfigService } from './src/utils/config/config-service.js';
import { createServer } from './src/adapters/http/server.js';

// Infrastructure factories
import { createPersistenceContext } from './src/infra/persistence/index.js';
import { createMessagingContext } from './src/infra/messaging/index.js';
import { createObsContext } from './src/infra/obs/index.js';
import { createSecurityContext } from './src/infra/security/index.js';
import { createRealtimeContext } from './src/infra/realtime/index.js';

// Domain context factories
import { createAccessControlContext } from './src/ctx/access-control/index.js';
import { createInventoryContext } from './src/ctx/inventory/index.js';
import { createOrdersContext } from './src/ctx/orders/index.js';
import { createCatalogContext } from './src/ctx/catalog/index.js';
import { createProcurementContext } from './src/ctx/procurement/index.js';
import { createManufacturingContext } from './src/ctx/manufacturing/index.js';
import { createSystemContext } from './src/ctx/system/index.js';
import { createQueriesContext } from './src/ctx/queries/index.js';
import { createObservabilityContext } from './src/ctx/observability/index.js';
import { createCommunicationContext } from './src/ctx/communication/index.js';
import { createSchedulerContext } from './src/ctx/scheduler/index.js';
import { createCronAdapter } from './src/adapters/scheduler/cron-adapter.js';
import { createTaskHandlers } from './src/adapters/scheduler/task-handlers.js';

// Adapters
import { createLocalCatalogGatewayAdapter as createInventoryCatalogGateway } from './src/ctx/inventory/infrastructure/adapters/local-catalog-gateway.adapter.js';
import { createLocalAccessControlGatewayAdapter } from './src/ctx/inventory/infrastructure/adapters/local-access-control-gateway.adapter.js';
import { createLocalCatalogGatewayAdapter as createOrdersCatalogGateway } from './src/ctx/orders/infrastructure/adapters/local-catalog-gateway.adapter.js';
import { createLocalInventoryGatewayAdapter } from './src/ctx/orders/infrastructure/adapters/local-inventory-gateway.adapter.js';
import { createLocalCustomerGatewayAdapter } from './src/ctx/orders/infrastructure/adapters/local-customer-gateway.adapter.js';

async function bootstrap() {
  console.log('🚀 IMS Shopfront - Starting...\n');

  // 1. Load configuration
  const environment = Deno.env.get('ENVIRONMENT') || 'local';
  const config = await createConfigService(environment);

  console.log(`📋 Environment: ${environment}`);

  // 2. Create context registry
  const ctx = createContextRegistry();

  // 3. Register infrastructure contexts
  console.log('🔧 Registering infrastructure contexts...');
  ctx
    .registerInfra('persistence', createPersistenceContext, [])
    .registerInfra('messaging', createMessagingContext, ['infra.persistence'])
    .registerInfra('obs', createObsContext, ['infra.persistence', 'infra.messaging'])
    .registerInfra('security', createSecurityContext, [])
    .registerInfra('realtime', createRealtimeContext, ['infra.messaging']);

  // 4. Register domain contexts
  console.log('🏗️  Registering domain contexts...');
  ctx
    .registerDomain('access-control', async (deps) => {
        return createAccessControlContext({
            kvPool: deps.persistence.kvPool,
            security: deps.security,
            eventBus: deps.messaging.eventBus,
            obs: deps.obs
        });
    }, [
      'infra.persistence',
      'infra.obs',
      'infra.security',
      'infra.messaging',
    ])
    .registerDomain('catalog', async (deps) => {
        return createCatalogContext({
            kvPool: deps.persistence.kvPool,
            eventBus: deps.messaging.eventBus,
            obs: deps.obs
        });
    }, [
      'infra.persistence',
      'infra.obs',
      'infra.messaging'
    ])
    .registerDomain('inventory', async (deps) => {
        // Resolve Gateways
        const catalogGateway = createInventoryCatalogGateway(deps.catalog);
        const accessControlGateway = createLocalAccessControlGatewayAdapter(deps['access-control']);

        return createInventoryContext({
            kvPool: deps.persistence.kvPool,
            cache: deps.persistence.cache,
            eventBus: deps.messaging.eventBus,
            obs: deps.obs,
            catalogGateway,
            accessControlGateway
        });
    }, [
      'infra.persistence',
      'infra.obs',
      'infra.messaging',
      'domain.access-control',
      'domain.catalog' // Add explicit dependency
    ])
    .registerDomain('orders', async (deps) => {
        // Resolve Gateways
        const catalogGateway = createOrdersCatalogGateway(deps.catalog);
        const inventoryGateway = createLocalInventoryGatewayAdapter(deps.inventory);
        const customerGateway = createLocalCustomerGatewayAdapter(deps['access-control']);

        return createOrdersContext({
            kvPool: deps.persistence.kvPool,
            eventBus: deps.messaging.eventBus,
            obs: deps.obs,
            catalogGateway,
            inventoryGateway,
            customerGateway
        });
    }, [
      'infra.persistence',
      'infra.obs',
      'infra.messaging',
      'domain.inventory',
      'domain.access-control',
      'domain.catalog' // Add explicit dependency
    ])
    .registerDomain('procurement', async (deps) => {
        return createProcurementContext({
            kvPool: deps.persistence.kvPool,
            inventory: deps.inventory
        });
    }, [
        'infra.persistence',
        'domain.inventory'
    ])
    .registerDomain('manufacturing', async (deps) => {
        return createManufacturingContext({
            kvPool: deps.persistence.kvPool,
            inventory: deps.inventory
        });
    }, [
        'infra.persistence',
        'domain.inventory'
    ])
    .registerDomain('system', async (deps) => {
        return createSystemContext({
            kvPool: deps.persistence.kvPool,
            messaging: deps.messaging
        });
    }, [
        'infra.persistence',
        'infra.messaging'
    ])
    .registerDomain('observability', async (deps) => {
        return createObservabilityContext({
            kvPool: deps.persistence.kvPool
        });
    }, [
        'infra.persistence'
    ])
    .registerDomain('communication', async (deps) => {
        return createCommunicationContext({
            kvPool: deps.persistence.kvPool,
            eventBus: deps.messaging.eventBus,
            accessControl: deps['access-control']
        });
    }, [
        'infra.persistence',
        'infra.messaging',
        'domain.access-control'
    ])
    .registerDomain('scheduler', async (deps) => {
        return createSchedulerContext({
            kvPool: deps.persistence.kvPool,
            eventBus: deps.messaging.eventBus
        });
    }, [
        'infra.persistence',
        'infra.messaging',
        'domain.system'
    ])
    .registerDomain('queries', async (deps) => {
        return createQueriesContext({
            orderRepository: deps.orders.repositories.order,
            shipmentRepository: deps.orders.repositories.shipment,
            workOrderRepository: deps.manufacturing.repositories.workOrder,
            poRepository: deps.procurement.repositories.purchaseOrder,
            userRepository: deps['access-control'].repositories.user,
            stockRepository: deps.inventory.repositories.stock,
            productRepository: deps.catalog.repositories.product,
            auditRepository: deps.observability.repositories.audit,
            obs: deps.obs
        });
    }, [
        'infra.obs',
        'domain.access-control',
        'domain.orders',
        'domain.inventory',
        'domain.catalog',
        'domain.manufacturing',
        'domain.procurement',
        'domain.observability'
    ]);

  // 5. Initialize all contexts (resolves dependency graph)
  console.log('⚙️  Initializing contexts...');
  await ctx.initialize(config);

  const obs = ctx.get('infra.obs');
  await obs.success('All contexts initialized', {
    contexts: ctx.list(),
    initOrder: ctx.getInitOrder(),
  });

  // 5.5 Register Scheduled Tasks
  const schedulerCtx = ctx.get('domain.scheduler');
  const scheduler = schedulerCtx?.services?.scheduler || schedulerCtx?.scheduler || schedulerCtx?.service;

  // Resolve dependencies for handlers
  const handlers = createTaskHandlers({
    inventory: ctx.get('domain.inventory'),
    orders: ctx.get('domain.orders'),
    system: ctx.get('domain.system'),
    catalog: ctx.get('domain.catalog'),
    manufacturing: ctx.get('domain.manufacturing'),
    procurement: ctx.get('domain.procurement'),
    crm: ctx.get('domain.communication'),
    obs: ctx.get('infra.obs')
  });

  if (scheduler && typeof scheduler.registerHandler === 'function') {
      // Register all handlers
      Object.entries(handlers).forEach(([key, handler]) => {
          scheduler.registerHandler(key, handler);
      });

      // Sync definitions (default schedules)
      await scheduler.syncDefinitions('default', [
          {
              handlerKey: 'system.cleanup_audit_logs',
              name: 'Cleanup Old Audit Logs',
              description: 'Deletes audit logs older than 90 days',
              defaultSchedule: '0 3 * * *' // 3 AM Daily
          },
          {
              handlerKey: 'inventory.snapshot',
              name: 'Daily Inventory Snapshot',
              description: 'Logs total inventory value and item count.',
              defaultSchedule: '55 23 * * *' // 11:55 PM Daily
          },
          {
              handlerKey: 'inventory.check_low_stock',
              name: 'Check Low Stock',
              description: 'Scans for products below threshold and logs warnings.',
              defaultSchedule: '0 * * * *' // Hourly
          },
          {
              handlerKey: 'orders.cancel_stale',
              name: 'Cancel Stale Orders',
              description: 'Cancels unpaid orders older than 48 hours.',
              defaultSchedule: '0 */6 * * *' // Every 6 hours
          },
          {
              handlerKey: 'orders.send_payment_reminders',
              name: 'Send Payment Reminders',
              description: 'Sends emails for unpaid orders older than 24h.',
              defaultSchedule: '0 9 * * *' // 9 AM Daily
          },
          {
              handlerKey: 'catalog.sync_search_index',
              name: 'Sync Search Index',
              description: 'Re-indexes products for search optimization.',
              defaultSchedule: '0 2 * * *' // 2 AM Daily
          },
          {
              handlerKey: 'system.database_backup',
              name: 'Database Backup',
              description: 'Full backup of KV store to external storage.',
              defaultSchedule: '0 4 * * *' // 4 AM Daily
          },
          {
              handlerKey: 'manufacturing.check_overdue_work_orders',
              name: 'Check Overdue Work Orders',
              description: 'Flags work orders past their due date.',
              defaultSchedule: '0 8 * * *' // 8 AM Daily
          },
          {
              handlerKey: 'procurement.check_pending_pos',
              name: 'Check Pending POs',
              description: 'Checks for delayed purchase orders.',
              defaultSchedule: '0 10 * * *' // 10 AM Daily
          },
          {
              handlerKey: 'crm.compute_customer_ltv',
              name: 'Compute Customer LTV',
              description: 'Updates Lifetime Value metrics for customers.',
              defaultSchedule: '0 1 * * 1' // 1 AM Weekly (Monday)
      }
      ]);

      // Start Cron Ticker
      createCronAdapter(scheduler).start();
  } else {
      console.warn('⚠️ Scheduler service not available or invalid. Scheduled tasks disabled.');
  }


  // 6. Create and start server with both API and UI apps
  console.log('🌐 Creating HTTP server...');
  const app = createServer(ctx);
  const port = config.get('server.port');

  await obs.info(`Server starting on port ${port}`);

  Deno.serve({
    port,
    onListen: ({ hostname, port }) => {
      console.log(`\n✨ Server ready!`);
      console.log(`   🔗 UI:  http://localhost:${port}/`);
      console.log(`   🔗 API: http://localhost:${port}/api`);
      console.log(`   🔗 Health: http://localhost:${port}/health\n`);
    }
  }, app.fetch);

  // 7. Graceful shutdown
  const shutdown = async () => {
    console.log('\n\n🛑 Shutting down gracefully...');
    try {
        await obs.info('Shutting down gracefully...');
        await ctx.shutdown();
    } catch (e) {
        console.error('Error during shutdown', e);
    }
    console.log('👋 Goodbye!\n');
    Deno.exit(0);
  };

  Deno.addSignalListener('SIGINT', shutdown);
}

// Run
if (import.meta.main) {
  bootstrap().catch((error) => {
    console.error('❌ Bootstrap failed:', error);
    Deno.exit(1);
  });
}

export { bootstrap };
