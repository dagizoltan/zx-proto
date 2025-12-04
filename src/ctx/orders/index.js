import { createKVOrderRepository } from '../../infra/persistence/kv/repositories/kv-order-repository.js';
import { createCreateOrder } from './application/use-cases/create-order.js';
import { createUpdateOrderStatus } from './application/use-cases/update-order-status.js';
import { createListOrders } from './application/use-cases/list-orders.js';

export const createOrdersContext = async (deps) => {
  const { persistence, obs, messaging, registry } = deps;
  const { eventBus } = messaging;

  const orderRepository = createKVOrderRepository(persistence.kvPool);

  const createOrder = createCreateOrder({
    orderRepository,
    obs,
    registry,
    eventBus
  });

  const updateOrderStatus = createUpdateOrderStatus({
    orderRepository,
    registry,
    obs,
    eventBus
  });

  const getDashboardStats = createGetDashboardStats({ orderRepository });

  const getOrder = createGetOrder({ orderRepository });
  const listOrders = createListOrders({ orderRepository });

  return {
    name: 'orders',
    repositories: {
      order: orderRepository
    },
    useCases: {
      createOrder,
      updateOrderStatus,
      getDashboardStats,
      getOrder,
      listOrders
    }
  };
};

// Simple mock for stats - expanded to actually work slightly better if repo supported it,
// but for now keeping it simple or we'd need to add findAll to order repo.
const createGetDashboardStats = ({ orderRepository }) => {
    return {
        execute: async (tenantId) => {
             // Mock implementation, normally would aggregate from DB
            return {
                totalOrders: 150,
                revenue: 12500.50,
                activeProducts: 45,
                lowStockCount: 3
            };
        }
    }
}

const createGetOrder = ({ orderRepository }) => {
    const execute = async (tenantId, orderId) => {
        return await orderRepository.findById(tenantId, orderId);
    };
    return { execute };
};
