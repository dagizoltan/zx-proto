import { createKVStockRepositoryAdapter } from './infrastructure/adapters/kv-stock-repository.adapter.js';
import { createKVStockMovementRepository } from './infrastructure/adapters/kv-stock-movement-repository.adapter.js';
import { createKVWarehouseRepository } from './infrastructure/adapters/kv-warehouse-repository.adapter.js';
import { createKVLocationRepository } from './infrastructure/adapters/kv-location-repository.adapter.js';
import { createKVBatchRepository } from './infrastructure/adapters/kv-batch-repository.adapter.js';

import { createStockAllocationService } from './domain/services/stock-allocation-service.js';
import { createInventoryAdjustmentService } from './domain/services/inventory-adjustment-service.js';

import { createUpdateStock } from './application/use-cases/update-stock.js';
import { createCheckAvailability } from './application/use-cases/check-availability.js';
import { createGetProduct } from './application/use-cases/get-product.js';
import { createReserveStock } from './application/use-cases/reserve-stock.js';
import { createListAllProducts } from './application/use-cases/list-all-products.js';
import { createReceiveStock } from './application/use-cases/receive-stock.js';
import { createMoveStock } from './application/use-cases/move-stock.js';
import { createConfirmStockShipment } from './application/use-cases/confirm-stock-shipment.js';
import { createCancelStockReservation } from './application/use-cases/cancel-stock-reservation.js';
import { createListStockMovements } from './application/use-cases/list-stock-movements.js';
import { createCreateWarehouse } from './application/use-cases/create-warehouse.js';
import { createCreateLocation } from './application/use-cases/create-location.js';
import { createConsumeStock } from './application/use-cases/consume-stock.js';
import { createGetProductsBatch } from './application/use-cases/get-products-batch.js';
import { createGetPickingList } from './application/use-cases/get-picking-list.js';
import { unwrap } from '../../../lib/trust/index.js';

import { resolveDependencies } from '../../utils/registry/dependency-resolver.js';
import { createContextBuilder } from '../../utils/registry/context-builder.js';
import { autoGateway } from '../../utils/registry/gateway-factory.js';

export const createInventoryContext = async (deps) => {
    const { kvPool, eventBus, cache, obs } = resolveDependencies(deps, {
        kvPool: ['persistence.kvPool', 'kvPool'],
        eventBus: ['messaging.eventBus', 'eventBus'],
        cache: ['persistence.cache', 'cache'],
        obs: ['observability.obs']
    });

    const catalogGateway = autoGateway(deps, 'catalog');
    const accessControlGateway = autoGateway(deps, 'access-control');

    // Product Compat Repo
    const productRepositoryCompatibility = {
        findById: (tenantId, id) => catalogGateway.getProduct(tenantId, id),
        query: (tenantId, options) => catalogGateway.listProducts(tenantId, options), // Mapped list -> listProducts
        save: () => { throw new Error('Inventory cannot save products anymore'); },
    };

    const stockRepository = createKVStockRepositoryAdapter(kvPool);

    // Legacy Repos
    const stockMovementRepository = createKVStockMovementRepository(kvPool);
    const warehouseRepository = createKVWarehouseRepository(kvPool);
    const locationRepository = createKVLocationRepository(kvPool);
    const batchRepository = createKVBatchRepository(kvPool);

    // Services
    const stockAllocationService = createStockAllocationService(stockRepository, stockMovementRepository, batchRepository, productRepositoryCompatibility, kvPool);
    const inventoryAdjustmentService = createInventoryAdjustmentService(stockRepository, stockMovementRepository, batchRepository, productRepositoryCompatibility, kvPool);

    // Use Cases
    const updateStock = createUpdateStock({
        stockRepository,
        catalogGateway,
        obs,
        eventBus,
    });

    const checkAvailability = createCheckAvailability({
        stockRepository,
        cache,
    });

    const getProduct = createGetProduct({
        productRepository: productRepositoryCompatibility,
    });

    const getProductsBatch = createGetProductsBatch({
        productRepository: productRepositoryCompatibility
    });

    const reserveStock = createReserveStock({
        stockAllocationService
    });

    const listAllProducts = createListAllProducts({
        productRepository: productRepositoryCompatibility,
        stockRepository
    });

    const receiveStock = createReceiveStock({
        inventoryAdjustmentService
    });

    const consumeStock = createConsumeStock({
        inventoryAdjustmentService
    });

    const moveStock = createMoveStock({
        stockRepository,
        stockMovementRepository
    });

    const confirmStockShipment = createConfirmStockShipment({
        stockAllocationService
    });

    const cancelStockReservation = createCancelStockReservation({
        stockAllocationService
    });

    const listStockMovements = createListStockMovements({
        stockMovementRepository
    });

    const createWarehouse = createCreateWarehouse({
        warehouseRepository,
        eventBus
    });

    const createLocation = createCreateLocation({
        locationRepository,
        warehouseRepository,
        eventBus
    });

    const getPickingList = createGetPickingList({
        stockMovementRepository,
        catalogGateway,
        locationRepository,
        batchRepository
    });

    const executeProduction = {
        execute: async (...args) => stockAllocationService.executeProduction(...args)
    };

    const receiveStockRobust = {
        execute: async (...args) => stockAllocationService.receiveStockRobust(...args)
    };

    const receiveStockBatch = {
        execute: async (...args) => stockAllocationService.receiveStockBatch(...args)
    };

    // --- COMPATIBILITY LAYERS (For Auto-Gateways) ---

    // Orders expect `reserveStock(tenantId, items, orderId)` which maps to batch execution
    const reserveStockCompat = {
        execute: async (tenantId, items, orderId) => reserveStock.executeBatch(tenantId, items, orderId)
    };

    // Manufacturing expects flattened args for production
    const executeProductionCompat = {
        execute: async (tenantId, productionItems, consumptionItems, refId, userId) => {
             return stockAllocationService.executeProduction(tenantId, {
                produce: productionItems,
                consume: consumptionItems,
                reason: refId,
                userId: userId || null
             });
        }
    };

    // Procurement expects `receiveStock(tenantId, items, refId)` to map to batch
    const receiveStockCompat = {
        execute: async (tenantId, items, refId) => {
            return stockAllocationService.receiveStockBatch(tenantId, {
                items,
                reason: refId
            });
        }
    };

    const confirmShipmentCompat = {
        execute: async (tenantId, orderId, items) => confirmStockShipment.execute(tenantId, orderId, items)
    };

    const releaseStockCompat = {
        execute: async (tenantId, orderId) => cancelStockReservation.execute(tenantId, orderId)
    };

    // Helper for permission checks
    const checkUserPermission = async (tenantId, userId, action) => {
        // accessControlGateway is now a proxy to useCases
        // createCheckPermission.execute(tenantId, userId, resource, action) ??
        // Actually, checkPermission use case signature in access-control is: execute(tenantId, userId, resource, action)
        // Let's verify access-control signature.
        return unwrap(await accessControlGateway.checkPermission(tenantId, userId, 'inventory', action));
    };

    return createContextBuilder('inventory')
        .withRepositories({
            stock: stockRepository,
            warehouse: warehouseRepository,
            location: locationRepository,
            batch: batchRepository,
            stockMovement: stockMovementRepository,
        })
        .withServices({
            stockAllocation: stockAllocationService,
        })
        .withUseCases({
            updateStock,
            checkAvailability,
            getProduct,
            getProductsBatch,
            // Use compatibility wrappers for auto-gateway consumers
            reserveStock: reserveStockCompat,
            listAllProducts,
            receiveStock: receiveStockCompat,
            consumeStock,
            moveStock,
            confirmStockShipment: confirmShipmentCompat,
            confirmShipment: confirmShipmentCompat, // alias for Orders
            cancelStockReservation, // kept for internal/explicit usage
            releaseStock: releaseStockCompat, // alias for Orders
            listStockMovements,
            createWarehouse,
            createLocation,
            getPickingList,
            executeProduction: executeProductionCompat,
            receiveStockRobust,
            receiveStockBatch
        })
        .withProps({
            checkUserPermission
        })
        .build();
};

export const InventoryContext = {
    name: 'inventory',
    dependencies: [
        'infra.persistence',
        'domain.observability',
        'infra.messaging',
        'domain.access-control',
        'domain.catalog'
    ],
    factory: createInventoryContext
};
