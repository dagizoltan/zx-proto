import { createKVShipmentRepositoryAdapter } from './infrastructure/adapters/kv-shipment-repository.adapter.js';

import { createCommandBus } from '../../infra/command-bus/index.js';
import { createOrderHandlers, InitializeOrder } from './domain.js';
import { createOrderProjector } from './projector.js';
import { createOrderProcessManager } from './process-manager.js';

import { createCreateShipment } from './application/use-cases/create-shipment.js';
import { createListShipments } from './application/use-cases/list-shipments.js';
import { createOutboxWorker } from '../../infra/messaging/worker/outbox-worker.js'; // Import Worker

import { resolveDependencies } from '../../utils/registry/dependency-resolver.js';
import { createContextBuilder } from '../../utils/registry/context-builder.js';
import { autoGateway } from '../../utils/registry/gateway-factory.js';

export const createOrdersContext = async (deps) => {
  const { kvPool, eventBus, obs, eventStore } = resolveDependencies(deps, {
    kvPool: ['persistence.kvPool', 'kvPool'],
    eventBus: ['messaging.eventBus', 'eventBus'],
    eventStore: ['persistence.eventStore', 'eventStore'],
    obs: ['observability.obs']
  });

  const catalogGateway = autoGateway(deps, 'catalog');
  // Use `autoGateway` for inventory, but we might need the command bus if it's external?
  // In the pure system, ProcessManager talks to Inventory Command Bus.
  // Ideally, Inventory Command Bus is exposed via the Inventory Context or a Gateway.
  // For now, we assume `inventoryGateway` is a legacy interface, BUT `OrderProcessManager` was refactored
  // to take `inventoryCommandBus`.
  // Wait, `OrderProcessManager` signature is `(commandBus, inventoryCommandBus)`.
  // I need to get `inventoryCommandBus` from deps or construct it?
  // `inventoryCommandBus` relies on `kvPool` and `eventStore` which are shared.
  // So I can reconstruct it here easily.

  const inventoryCommandBus = createCommandBus(kvPool, eventStore);
  // I need to register inventory handlers to it?
  // Handlers are in `inventory` domain.
  // Ideally, `InventoryContext` exposes its CommandBus.
  // Since `InventoryContext` factory *returns* `commandBus` (I added this in previous step plan? No, `createCounterContext` returned it. `InventoryContext` didn't return it explicitly in `createInventoryContext`).
  // Let's check `src/ctx/inventory/index.js`.

  const catalogContext = deps.get('domain.catalog'); // Access other context?
  // `resolveDependencies` gives services.

  // Start the Outbox Worker to ensure events flow
  const worker = createOutboxWorker(kvPool, eventBus);
  worker.start();

  // --- 1. Event Sourcing Setup ---
  const commandBus = createCommandBus(kvPool, eventStore); // FIXED: Removed eventBus arg
  const orderHandlers = createOrderHandlers();

  // Register Handlers
  Object.keys(orderHandlers).forEach(type => {
      commandBus.registerHandler(type, orderHandlers[type]);
  });

  // RE-REGISTER INVENTORY HANDLERS LOCALLY FOR THE PROCESS MANAGER?
  // Or assume the process manager dispatches to a bus that *has* them.
  // If `inventoryCommandBus` is empty, it throws "Unknown command".
  // I need to import `createInventoryHandlers` and register them here,
  // OR get the actual Inventory Command Bus.
  // Given the monolithic app structure, I can just register them again on a new bus instance sharing the same DB.
  // This is "Context Mapping" via Shared Kernel (the infra).

  // Dynamic import to avoid circular dependency if possible, but static is fine here.
  const { createInventoryHandlers } = await import('../inventory/domain/index.js');
  const inventoryHandlers = createInventoryHandlers();
  Object.keys(inventoryHandlers).forEach(type => {
      inventoryCommandBus.registerHandler(type, inventoryHandlers[type]);
  });


  // Projector (Updates Read Model)
  const orderProjector = createOrderProjector(kvPool);

  // Process Manager (Orchestrates Workflows)
  const orderProcessManager = createOrderProcessManager(commandBus, inventoryCommandBus);

  // Wire up Subscriptions
  eventBus.subscribe('OrderInitialized', async (data) => {
      await Promise.all([
          orderProjector.handle(data),
          orderProcessManager.handle(data)
      ]);
  });

  eventBus.subscribe('StockReserved', async (data) => orderProcessManager.handle(data));
  eventBus.subscribe('StockAllocationFailed', async (data) => orderProcessManager.handle(data));

  eventBus.subscribe('OrderConfirmed', async (data) => orderProjector.handle(data));
  eventBus.subscribe('OrderRejected', async (data) => orderProjector.handle(data));

  // --- 2. Adapters (Secondary Ports) ---
  const shipmentRepository = createKVShipmentRepositoryAdapter(kvPool);

  // The "OrderRepository" is now just a Read DAO for the View
  const orderReadRepository = {
      findById: async (tenantId, id) => {
          const key = ['view', 'orders', tenantId, id];
          const res = await kvPool.withConnection(kv => kv.get(key));
          return res.value;
      },
      list: async (tenantId, { limit = 10 } = {}) => {
          return kvPool.withConnection(async kv => {
              const iter = kv.list({ prefix: ['view', 'orders', tenantId] }, { limit });
              const items = [];
              for await (const entry of iter) items.push(entry.value);
              return items;
          });
      },
      save: async () => { throw new Error("Writes must go through CommandBus"); }
  };

  // --- 3. Use Cases (Primary Ports) ---

  const createOrder = {
      execute: async (tenantId, orderData) => {
          const orderId = crypto.randomUUID();

          await commandBus.execute({
              type: InitializeOrder,
              aggregateId: orderId,
              tenantId,
              payload: {
                  tenantId,
                  customerId: orderData.customerId,
                  items: orderData.items
              }
          });

          return { id: orderId, status: 'PENDING', message: 'Order processing started' };
      }
  };

  const listOrders = {
      execute: async (tenantId, params) => orderReadRepository.list(tenantId, params)
  };

  const getOrder = {
      execute: async (tenantId, id) => orderReadRepository.findById(tenantId, id)
  };

  const updateOrderStatus = {
      execute: async () => { throw new Error("Direct status update not supported. Use Events."); }
  };

  // Legacy InventoryGateway for Shipment?
  // createShipment uses inventoryGateway to check stock?
  // Likely `createShipment` needs refactoring too, but out of scope for "Fix CommandBus".
  // We keep the `autoGateway` for legacy support in Shipment.
  const inventoryGateway = autoGateway(deps, 'inventory');

  const createShipment = createCreateShipment({
    shipmentRepository,
    orderRepository: orderReadRepository,
    inventoryGateway,
    eventBus
  });

  const listShipments = createListShipments({ shipmentRepository });

  return createContextBuilder('orders')
    .withRepositories({
      order: orderReadRepository,
      shipment: shipmentRepository
    })
    .withUseCases({
      createOrder,
      listOrders,
      getOrder,
      updateOrderStatus,
      createShipment,
      listShipments
    })
    .build();
};

export const OrdersContext = {
    name: 'orders',
    dependencies: [
        'infra.persistence',
        'domain.observability',
        'infra.messaging',
        'domain.inventory',
        'domain.access-control',
        'domain.catalog'
    ],
    factory: createOrdersContext
};
