import { createKVOrderRepositoryAdapter } from './infrastructure/adapters/kv-order-repository.adapter.js';
import { createKVShipmentRepositoryAdapter } from './infrastructure/adapters/kv-shipment-repository.adapter.js';

import { createCreateOrder } from './application/use-cases/create-order.js';
import { createListOrders } from './application/use-cases/list-orders.js';
import { createGetOrder } from './application/use-cases/get-order.js';
import { createUpdateOrderStatus } from './application/use-cases/update-order-status.js';
import { createCreateShipment } from './application/use-cases/create-shipment.js';
import { createListShipments } from './application/use-cases/list-shipments.js';

/**
 * Orders Context Factory
 *
 * @param {Object} deps - Explicit DI
 * @param {Object} deps.kvPool
 * @param {Object} deps.eventBus
 * @param {Object} deps.obs
 * @param {Object} deps.catalogGateway - Injected Gateway
 * @param {Object} deps.inventoryGateway - Injected Gateway
 * @param {Object} deps.customerGateway - Injected Gateway
 */
export const createOrdersContext = async ({
  kvPool,
  eventBus,
  obs,
  catalogGateway,
  inventoryGateway,
  customerGateway
}) => {

  // Adapters (Secondary Ports)
  const orderRepository = createKVOrderRepositoryAdapter(kvPool);
  const shipmentRepository = createKVShipmentRepositoryAdapter(kvPool);

  // Use Cases (Primary Ports)
  const createOrder = createCreateOrder({
    orderRepository,
    catalogGateway,
    inventoryGateway,
    customerGateway,
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
