
import { createCommandBus } from '../../infra/command-bus/index.js';
import { createShipmentHandlers, ShipmentCreated, ShipmentShipped } from './domain/index.js';
import { createShipmentProjector } from './projector.js';
import { createShipmentProcessManager } from './process-manager.js';

import { resolveDependencies } from '../../utils/registry/dependency-resolver.js';
import { createContextBuilder } from '../../utils/registry/context-builder.js';

export const createShipmentsContext = async (deps) => {
    const { kvPool, eventBus, eventStore, orderRepository } = resolveDependencies(deps, {
        kvPool: ['persistence.kvPool', 'kvPool'],
        eventBus: ['messaging.eventBus', 'eventBus'],
        eventStore: ['persistence.eventStore', 'eventStore'],
        // We need Order Read Repo. It might be in 'orders.repositories.order'?
        // Registry usually holds contexts.
        // We need to access the Orders Context to get its repository.
        // `deps.get('orders')`?
    });

    const ordersContext = deps.get('orders'); // Assuming registry provides access
    // If ordersContext is not yet initialized (circular dependency risk if bidirectional),
    // we might have an issue.
    // However, `Shipments` depends on `Orders` (upstream), so `Orders` should be init first.
    // `src/app.js` initializes in order.

    // Fallback: If we can't get the repo object, we can query the KV View directly since it's shared infra.
    // But let's try to get the repo from the context.
    const orderReadRepository = ordersContext?.repositories?.order || {
        findById: async (tenantId, id) => {
            // Direct KV fallback
            const res = await kvPool.withConnection(kv => kv.get(['view', 'orders', tenantId, id]));
            return res.value;
        }
    };

    const commandBus = createCommandBus(kvPool, eventStore);
    const handlers = createShipmentHandlers();
    Object.keys(handlers).forEach(t => commandBus.registerHandler(t, handlers[t]));

    const projector = createShipmentProjector(kvPool);
    const processManager = createShipmentProcessManager(commandBus, orderReadRepository);

    // Wire Subscriptions
    eventBus.subscribe('OrderConfirmed', async (data) => processManager.handle(data));
    eventBus.subscribe('ShipmentCreated', async (data) => projector.handle(data));
    eventBus.subscribe('ShipmentShipped', async (data) => projector.handle(data));

    // Read Repository
    const shipmentRepository = {
        findById: async (tenantId, id) => {
            const res = await kvPool.withConnection(kv => kv.get(['view', 'shipments', tenantId, id]));
            return res.value;
        },
        findByOrderId: async (tenantId, orderId) => {
             // Naive scan or need index.
             // For MVP scan.
             return kvPool.withConnection(async kv => {
                 const iter = kv.list({ prefix: ['view', 'shipments', tenantId] });
                 for await (const entry of iter) {
                     if (entry.value.orderId === orderId) return entry.value;
                 }
                 return null;
             });
        }
    };

    // Use Cases (Commands)
    const shipPackage = {
        execute: async (tenantId, shipmentId, tracking, carrier) => {
             await commandBus.execute({
                 type: 'ShipPackage',
                 aggregateId: shipmentId,
                 tenantId,
                 payload: { trackingNumber: tracking, carrier }
             });
             return { ok: true };
        }
    };

    return createContextBuilder('shipments')
        .withRepositories({
            shipment: shipmentRepository
        })
        .withUseCases({
            shipPackage,
            // Expose createShipment manually if needed? Usually automated.
        })
        .build();
};

export const ShipmentsContext = {
    name: 'shipments',
    dependencies: [
        'infra.persistence',
        'infra.messaging',
        'orders' // Explicit dependency on Orders
    ],
    factory: createShipmentsContext
};
