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
    .registerDomain('access-control', createAccessControlContext, [
      'infra.persistence',
      'infra.obs',
      'infra.security',
      'infra.messaging',
    ])
    .registerDomain('inventory', createInventoryContext, [
      'infra.persistence',
      'infra.obs',
      'infra.messaging',
      'domain.access-control',
    ])
    .registerDomain('orders', createOrdersContext, [
      'infra.persistence',
      'infra.obs',
      'infra.messaging',
      'domain.inventory',
      'domain.access-control',
    ])
    .registerDomain('catalog', createCatalogContext, [
      'infra.persistence',
      'infra.obs',
      'domain.inventory',
    ])
    .registerDomain('procurement', createProcurementContext, [
        'infra.persistence',
        'domain.inventory'
    ])
    .registerDomain('manufacturing', createManufacturingContext, [
        'infra.persistence',
        'domain.inventory'
    ])
    .registerDomain('system', createSystemContext, [
        'infra.persistence',
        'infra.messaging'
    ])
    .registerDomain('observability', createObservabilityContext, [
        'infra.persistence'
    ])
    .registerDomain('communication', createCommunicationContext, [
        'infra.persistence',
        'infra.messaging'
    ])
    .registerDomain('scheduler', createSchedulerContext, [
        'infra.persistence',
        'infra.messaging',
        'domain.system'
    ])
    .registerDomain('queries', createQueriesContext, [
        'domain.access-control',
        'domain.orders'
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
  const scheduler = ctx.get('domain.scheduler').service;
  const system = ctx.get('domain.system');

  // Register handlers
  scheduler.registerHandler('system.cleanup_audit_logs', (args) => system.useCases.cleanupAuditLogs.execute({ ...args, log: args.log }));

  // Sync definitions (default schedules)
  await scheduler.syncDefinitions('default', [
      {
          handlerKey: 'system.cleanup_audit_logs',
          name: 'Cleanup Old Audit Logs',
          description: 'Deletes audit logs older than 90 days',
          defaultSchedule: '0 3 * * *' // 3 AM Daily
      }
  ]);

  // Start Cron Ticker
  createCronAdapter(scheduler).start();

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
