import { createKVOrderRepository } from '../../infra/persistence/kv/repositories/kv-order-repository.js';
import { createKVShipmentRepository } from '../../infra/persistence/kv/repositories/kv-shipment-repository.js';

import { createCreateOrder } from './application/use-cases/create-order.js';
import { createListOrders } from './application/use-cases/list-orders.js';
import { createGetOrder } from './application/use-cases/get-order.js';
import { createUpdateOrderStatus } from './application/use-cases/update-order-status.js';
import { createCreateShipment } from './application/use-cases/create-shipment.js'; // NEW
import { createListShipments } from './application/use-cases/list-shipments.js'; // NEW

export const createOrdersContext = async (deps) => {
  const { persistence, registry, obs, messaging } = deps;
  const { eventBus } = messaging;

  const orderRepository = createKVOrderRepository(persistence.kvPool);
  const shipmentRepository = createKVShipmentRepository(persistence.kvPool); // NEW

  const createOrder = createCreateOrder({
    orderRepository,
    registry,
    obs,
    eventBus
  });

  const listOrders = createListOrders({
    orderRepository
  });

  const getOrder = createGetOrder({
    orderRepository
  });

  const updateOrderStatus = createUpdateOrderStatus({
    orderRepository,
    registry,
    obs,
    eventBus
  });

  const createShipment = createCreateShipment({
      shipmentRepository,
      orderRepository,
      inventoryService: registry.get('domain.inventory').useCases, // Access useCases directly or via service wrapper
      eventBus
  });

  const listShipments = createListShipments({
      shipmentRepository
  });

  return {
    name: 'orders',
    repositories: {
      order: orderRepository,
      shipment: shipmentRepository
    },
    useCases: {
      createOrder,
      listOrders,
      getOrder,
      updateOrderStatus,
      createShipment,
      listShipments
    }
  };
};
