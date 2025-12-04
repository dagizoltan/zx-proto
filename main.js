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
    .registerInfra('obs', createObsContext, ['infra.persistence'])
    .registerInfra('messaging', createMessagingContext, ['infra.persistence'])
    .registerInfra('security', createSecurityContext, [])
    .registerInfra('realtime', createRealtimeContext, ['infra.messaging']);

  // 4. Register domain contexts
  console.log('🏗️  Registering domain contexts...');
  ctx
    .registerDomain('accessControl', createAccessControlContext, [
      'infra.persistence',
      'infra.obs',
      'infra.security',
    ])
    .registerDomain('inventory', createInventoryContext, [
      'infra.persistence',
      'infra.obs',
      'infra.messaging',
      'domain.accessControl',
    ])
    .registerDomain('orders', createOrdersContext, [
      'infra.persistence',
      'infra.obs',
      'infra.messaging',
      'domain.inventory',
      'domain.accessControl',
    ])
    .registerDomain('catalog', createCatalogContext, [
      'infra.persistence',
      'infra.obs',
      'domain.inventory',
    ]);

  // 5. Initialize all contexts (resolves dependency graph)
  console.log('⚙️  Initializing contexts...');
  await ctx.initialize(config);

  const obs = ctx.get('infra.obs');
  await obs.success('All contexts initialized', {
    contexts: ctx.list(),
    initOrder: ctx.getInitOrder(),
  });

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
  // Deno.addSignalListener('SIGTERM', shutdown); // SIGTERM not supported on all platforms/Deno versions seamlessly, but usually good practice.
}

// Run
if (import.meta.main) {
  bootstrap().catch((error) => {
    console.error('❌ Bootstrap failed:', error);
    Deno.exit(1);
  });
}

export { bootstrap };
