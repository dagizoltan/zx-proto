import { createGetCustomerProfile } from './application/use-cases/get-customer-profile.js';
import { createGetDashboardStats } from './application/use-cases/get-dashboard-stats.js';

/**
 * Queries Context Factory (Read Model Aggregator)
 *
 * @param {Object} deps - Explicit DI
 * @param {Object} deps.orderRepository
 * @param {Object} deps.shipmentRepository
 * @param {Object} deps.workOrderRepository
 * @param {Object} deps.poRepository
 * @param {Object} deps.userRepository
 * @param {Object} deps.stockRepository
 * @param {Object} deps.productRepository
 * @param {Object} deps.auditRepository
 * @param {Object} deps.obs
 */
export const createQueriesContext = async ({
    orderRepository,
    shipmentRepository,
    workOrderRepository,
    poRepository,
    userRepository,
    stockRepository,
    productRepository,
    auditRepository,
    obs
}) => {

    const getCustomerProfile = createGetCustomerProfile({
        userRepository,
        orderRepository,
        obs
    });

    const getDashboardStats = createGetDashboardStats({
        orderRepository,
        shipmentRepository,
        workOrderRepository,
        poRepository,
        userRepository,
        stockRepository,
        productRepository,
        auditRepository
    });

    return {
        name: 'queries',
        useCases: {
            getCustomerProfile,
            getDashboardStats
        }
    };
};
