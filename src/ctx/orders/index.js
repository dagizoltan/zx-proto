import { createKVOrderRepository } from '../../infra/persistence/kv/repositories/kv-order-repository.js';
import { createCreateOrder } from './application/use-cases/create-order.js';

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

  const getDashboardStats = createGetDashboardStats({ orderRepository });

  return {
    name: 'orders',
    repositories: {
      order: orderRepository
    },
    useCases: {
      createOrder,
      getDashboardStats
    }
  };
};

// Simple mock for stats
const createGetDashboardStats = ({ orderRepository }) => {
    return {
        execute: async () => {
            return {
                totalOrders: 0, // Implement actual counting in repo if needed
                revenue: 0
            };
        }
    }
}
