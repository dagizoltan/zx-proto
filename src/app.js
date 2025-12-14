import { createContextRegistry } from './utils/registry/context-registry.js';
import { createConfigService } from './utils/config/config-service.js';
import { createServer } from './adapters/http/server.js';
import { bootstrapScheduler } from './adapters/scheduler/bootstrap.js';

// Infrastructure Contexts
import { PersistenceContext } from './infra/persistence/index.js';
import { MessagingContext } from './infra/messaging/index.js';
import { ObsContext } from './infra/obs/index.js';
import { SecurityContext } from './infra/security/index.js';
import { RealtimeContext } from './infra/realtime/index.js';

// Domain Contexts
import { AccessControlContext } from './ctx/access-control/index.js';
import { CatalogContext } from './ctx/catalog/index.js';
import { InventoryContext } from './ctx/inventory/index.js';
import { OrdersContext } from './ctx/orders/index.js';
import { ProcurementContext } from './ctx/procurement/index.js';
import { ManufacturingContext } from './ctx/manufacturing/index.js';
import { SystemContext } from './ctx/system/index.js';
import { ObservabilityContext } from './ctx/observability/index.js';
import { CommunicationContext } from './ctx/communication/index.js';
import { SchedulerContext } from './ctx/scheduler/index.js';
import { QueriesContext } from './ctx/queries/index.js';

export const createApp = async (options = {}) => {
  const environment = options.environment || Deno.env.get('ENVIRONMENT') || 'local';

  console.log('🚀 IMS Shopfront - Bootstrapping...\n');
  console.log(`📋 Environment: ${environment}`);

  // 1. Load Config
  const config = await createConfigService(environment);

  // 2. Setup Registry
  const registry = createContextRegistry();

  // 3. Register Contexts (Declarative)
  const contexts = [
      // Infrastructure
      PersistenceContext,
      MessagingContext,
      ObsContext,
      SecurityContext,
      RealtimeContext,

      // Domains
      AccessControlContext,
      CatalogContext,
      InventoryContext,
      OrdersContext,
      ProcurementContext,
      ManufacturingContext,
      SystemContext,
      ObservabilityContext,
      CommunicationContext,
      SchedulerContext,
      QueriesContext
  ];

  contexts.forEach(ctx => registry.register(ctx));

  // 4. Initialize
  console.log('⚙️  Initializing contexts...');
  await registry.initialize(config);

  const obs = registry.get('infra.obs');
  await obs.success('All contexts initialized', {
    contexts: registry.list(),
    initOrder: registry.getInitOrder(),
  });

  // 5. Bootstrap Scheduler
  await bootstrapScheduler(registry);

  // 6. Create Server
  const app = createServer(registry);
  const port = config.get('server.port');

  return {
      registry,
      app,
      port,
      start: async () => {
          console.log('🌐 Starting HTTP server...');
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
      },
      shutdown: async () => {
          console.log('\n\n🛑 Shutting down gracefully...');
          try {
              await obs.info('Shutting down gracefully...');
              await registry.shutdown();
          } catch (e) {
              console.error('Error during shutdown', e);
          }
          console.log('👋 Goodbye!\n');
      }
  };
};
