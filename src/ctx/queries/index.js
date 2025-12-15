import { createGetCustomerProfile } from './application/use-cases/get-customer-profile.js';
import { createGetDashboardStats } from './application/use-cases/get-dashboard-stats.js';
import { resolveDependencies } from '../../utils/registry/dependency-resolver.js';
import { createContextBuilder } from '../../utils/registry/context-builder.js';

export const createQueriesContext = async (deps) => {
    // Resolve all Repositories from other domains
    // This context aggregates read models
    const {
        orderRepository,
        shipmentRepository,
        workOrderRepository,
        poRepository,
        userRepository,
        stockRepository,
        productRepository,
        auditRepository,
        obs
    } = resolveDependencies(deps, {
        orderRepository: ['orders.repositories.order', 'domain.orders.repositories.order'],
        shipmentRepository: ['orders.repositories.shipment', 'domain.orders.repositories.shipment'],
        workOrderRepository: ['manufacturing.repositories.workOrder', 'domain.manufacturing.repositories.workOrder'],
        poRepository: ['procurement.repositories.purchaseOrder', 'domain.procurement.repositories.purchaseOrder'],
        userRepository: ['access-control.repositories.user', 'domain.access-control.repositories.user'],
        stockRepository: ['inventory.repositories.stock', 'domain.inventory.repositories.stock'],
        productRepository: ['catalog.repositories.product', 'domain.catalog.repositories.product'],
        auditRepository: ['observability.repositories.audit', 'domain.observability.repositories.audit'],
        obs: ['observability.obs']
    });

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

    return createContextBuilder('queries')
        .withUseCases({
            getCustomerProfile,
            getDashboardStats
        })
        .build();
};

export const QueriesContext = {
    name: 'queries',
    dependencies: [
        'domain.observability',
        'domain.access-control',
        'domain.orders',
        'domain.inventory',
        'domain.catalog',
        'domain.manufacturing',
        'domain.procurement',
        'domain.observability'
    ],
    factory: createQueriesContext
};
