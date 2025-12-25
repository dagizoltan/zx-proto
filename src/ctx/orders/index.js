import { createKVShipmentRepositoryAdapter } from './infrastructure/adapters/kv-shipment-repository.adapter.js';

import { createCommandBus } from '../../infra/command-bus/index.js';
import { createOrderHandlers, InitializeOrder } from './domain.js';
import { createOrderProjector } from './projector.js';
import { createOrderProcessManager } from './process-manager.js';

import { createCreateShipment } from './application/use-cases/create-shipment.js';
import { createListShipments } from './application/use-cases/list-shipments.js';

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
  const inventoryGateway = autoGateway(deps, 'inventory');
  const customerGateway = autoGateway(deps, 'access-control');

  // --- 1. Event Sourcing Setup ---
  const commandBus = createCommandBus(kvPool, eventStore, eventBus);
  const orderHandlers = createOrderHandlers();

  // Register Handlers
  Object.keys(orderHandlers).forEach(type => {
      commandBus.registerHandler(type, orderHandlers[type]);
  });

  // Projector (Updates Read Model)
  const orderProjector = createOrderProjector(kvPool);

  // Process Manager (Orchestrates Workflows)
  const orderProcessManager = createOrderProcessManager(commandBus, inventoryGateway);

  // Wire up Subscriptions
  // In a real app, these would be durable subscriptions.
  // Here we hook into the eventBus.
  eventBus.subscribe('OrderInitialized', async (data) => {
      // EventBus payload wraps the event? Let's check `kv-event-bus.js`.
      // It passes `event.payload` to handler.
      // Our `EventStore` publishes `evt` as the payload.
      // So `data` here IS the domain event.
      await Promise.all([
          orderProjector.handle(data),
          orderProcessManager.handle(data)
      ]);
  });

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
          // Naive list implementation using the view prefix
          // Real impl would need an index or secondary index if we query by status
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

  // REFACTORED: Create Order -> Dispatch Command
  const createOrder = {
      execute: async (tenantId, orderData) => {
          // Input: { items, customerId }
          const orderId = crypto.randomUUID();

          await commandBus.execute({
              type: InitializeOrder,
              aggregateId: orderId,
              tenantId,
              payload: {
                  tenantId,
                  customerId: orderData.customerId, // Access Control bridge needed?
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

  // Deprecated/Legacy: Update Status directly is not allowed in pure ES
  const updateOrderStatus = {
      execute: async () => { throw new Error("Direct status update not supported. Use Events."); }
  };

  const createShipment = createCreateShipment({
    shipmentRepository,
    orderRepository: orderReadRepository, // Read-only is fine for verification
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
