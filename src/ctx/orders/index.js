import { createKVOrderRepositoryAdapter } from './infrastructure/adapters/kv-order-repository.adapter.js';
import { createKVShipmentRepositoryAdapter } from './infrastructure/adapters/kv-shipment-repository.adapter.js';
import { createLocalCatalogGatewayAdapter } from './infrastructure/adapters/local-catalog-gateway.adapter.js';
import { createLocalInventoryGatewayAdapter } from './infrastructure/adapters/local-inventory-gateway.adapter.js';
import { createLocalCustomerGatewayAdapter } from './infrastructure/adapters/local-customer-gateway.adapter.js';

import { createCreateOrder } from './application/use-cases/create-order.js';
import { createListOrders } from './application/use-cases/list-orders.js';
import { createGetOrder } from './application/use-cases/get-order.js';
import { createUpdateOrderStatus } from './application/use-cases/update-order-status.js';
import { createCreateShipment } from './application/use-cases/create-shipment.js';
import { createListShipments } from './application/use-cases/list-shipments.js';

export const createOrdersContext = async (deps) => {
  const { persistence, registry, obs, messaging } = deps;
  const { eventBus } = messaging;

  // Adapters (Secondary Ports)
  const orderRepository = createKVOrderRepositoryAdapter(persistence.kvPool);
  const shipmentRepository = createKVShipmentRepositoryAdapter(persistence.kvPool);

  // Gateways (Secondary Ports)
  const catalogGateway = createLocalCatalogGatewayAdapter(registry);
  const inventoryGateway = createLocalInventoryGatewayAdapter(registry);
  const customerGateway = createLocalCustomerGatewayAdapter(registry);

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
