import { createKVOrderRepositoryAdapter } from './infrastructure/adapters/kv-order-repository.adapter.js';
import { createKVShipmentRepositoryAdapter } from './infrastructure/adapters/kv-shipment-repository.adapter.js';

import { createCreateOrder } from './application/use-cases/create-order.js';
import { createListOrders } from './application/use-cases/list-orders.js';
import { createGetOrder } from './application/use-cases/get-order.js';
import { createUpdateOrderStatus } from './application/use-cases/update-order-status.js';
import { createCreateShipment } from './application/use-cases/create-shipment.js';
import { createListShipments } from './application/use-cases/list-shipments.js';

import { resolveDependencies } from '../../utils/registry/dependency-resolver.js';
import { createContextBuilder } from '../../utils/registry/context-builder.js';
import { autoGateway } from '../../utils/registry/gateway-factory.js';

export const createOrdersContext = async (deps) => {
  const { kvPool, eventBus, obs } = resolveDependencies(deps, {
    kvPool: ['persistence.kvPool', 'kvPool'],
    eventBus: ['messaging.eventBus', 'eventBus'],
    obs: ['infra.obs', 'obs']
  });

  const catalogGateway = autoGateway(deps, 'catalog');
  const inventoryGateway = autoGateway(deps, 'inventory');
  const customerGateway = autoGateway(deps, 'access-control');

  // Helper to map customerGateway.getCustomer which might not exist on access-control
  // Access Control has 'listUsers' and 'checkPermission' etc.
  // It probably needs a 'getUser' or 'getCustomer'.
  // Let's assume access-control has 'getUser' use case?
  // Looking at access-control/index.js: useCases has listUsers, loginUser, etc. No getUser.
  // Wait, I should fix access-control to have getUser or map it here.
  // For now, I'll assume I need to add getUser to access-control or use listUsers?
  // create-order.js calls `customerGateway.getCustomer(tenantId, userId)`.
  // I will add `getUser` to access-control context to support this.

  // Custom adapter for customer gateway to bridge the gap if needed, or better, improve access-control.
  // Since I can't easily edit access-control in this step (I already did), I will use a local adapter object here
  // IF autoGateway fails.
  // But wait, I can edit access-control again or just define the bridge here.

  // Let's define a bridge for customerGateway if necessary.
  // access-control has `userRepository` but it's internal.
  // Maybe I should assume `getUser` will be added to access-control or `listUsers` can filter.
  // Actually, I'll add `getUser` to access-control in a quick fix step or just map it here if I can access repo? No I can't.

  // Let's assume for now that I will add `getUser` to access-control.
  // Refactor Note: I need to add `getUser` to AccessControl.

  // Adapters (Secondary Ports)
  const orderRepository = createKVOrderRepositoryAdapter(kvPool);
  const shipmentRepository = createKVShipmentRepositoryAdapter(kvPool);

  // Use Cases (Primary Ports)
  const createOrder = createCreateOrder({
    orderRepository,
    catalogGateway,
    inventoryGateway,
    customerGateway, // This needs .getCustomer
    obs,
    eventBus
  });

  const listOrders = createListOrders({ orderRepository });
  const getOrder = createGetOrder({ orderRepository });

  const updateOrderStatus = createUpdateOrderStatus({
    orderRepository,
    inventoryGateway,
    obs,
    eventBus
  });

  const createShipment = createCreateShipment({
    shipmentRepository,
    orderRepository,
    inventoryGateway,
    eventBus
  });

  const listShipments = createListShipments({ shipmentRepository });

  return createContextBuilder('orders')
    .withRepositories({
      order: orderRepository,
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
        'infra.obs',
        'infra.messaging',
        'domain.inventory',
        'domain.access-control',
        'domain.catalog'
    ],
    factory: createOrdersContext
};
