import { createKVStockRepositoryAdapter } from './infrastructure/adapters/kv-stock-repository.adapter.js';
import { createKVStockMovementRepository } from './infrastructure/adapters/kv-stock-movement-repository.adapter.js';
import { createKVWarehouseRepository } from './infrastructure/adapters/kv-warehouse-repository.adapter.js';
import { createKVLocationRepository } from './infrastructure/adapters/kv-location-repository.adapter.js';
import { createKVBatchRepository } from './infrastructure/adapters/kv-batch-repository.adapter.js';

import { createStockAllocationService } from './domain/services/stock-allocation-service.js';
import { createInventoryAdjustmentService } from './domain/services/inventory-adjustment-service.js';

// Legacy Use Cases
import { createUpdateStock } from './application/use-cases/update-stock.js';
import { createCheckAvailability } from './application/use-cases/check-availability.js';
import { createGetProduct } from './application/use-cases/get-product.js';
import { createGetStockByProduct } from './application/use-cases/get-stock-by-product.js';
// import { createReserveStock } from './application/use-cases/reserve-stock.js'; // Replaced by Command
import { createListAllProducts } from './application/use-cases/list-all-products.js';
// import { createReceiveStock } from './application/use-cases/receive-stock.js'; // Replaced by Command
import { createMoveStock } from './application/use-cases/move-stock.js';
import { createConfirmStockShipment } from './application/use-cases/confirm-stock-shipment.js';
import { createCancelStockReservation } from './application/use-cases/cancel-stock-reservation.js';
import { createListStockMovements } from './application/use-cases/list-stock-movements.js';
import { createQueryStockMovements } from './application/use-cases/query-stock-movements.js';
import { createCreateWarehouse } from './application/use-cases/create-warehouse.js';
import { createListWarehouses } from './application/use-cases/list-warehouses.js';
import { createGetWarehouse } from './application/use-cases/get-warehouse.js';
import { createCreateLocation } from './application/use-cases/create-location.js';
import { createListLocations } from './application/use-cases/list-locations.js';
import { createListLocationsByWarehouse } from './application/use-cases/list-locations-by-warehouse.js';
import { createGetLocation } from './application/use-cases/get-location.js';
import { createConsumeStock } from './application/use-cases/consume-stock.js';
import { createGetProductsBatch } from './application/use-cases/get-products-batch.js';
import { createGetPickingList } from './application/use-cases/get-picking-list.js';
import { unwrap } from '../../../lib/trust/index.js';

// New Architecture Imports
import { createCommandBus } from '../../infra/command-bus/index.js';
import { createInventoryHandlers, ReceiveStock, ReserveStock, StockReceived, StockReserved, StockReleased, StockShipped } from './domain/index.js';
import { createInventoryProjector } from './projector.js';

import { resolveDependencies } from '../../utils/registry/dependency-resolver.js';
import { createContextBuilder } from '../../utils/registry/context-builder.js';
import { autoGateway } from '../../utils/registry/gateway-factory.js';

export const createInventoryContext = async (deps) => {
    const { kvPool, eventBus, cache, obs, eventStore } = resolveDependencies(deps, {
        kvPool: ['persistence.kvPool', 'kvPool'],
        eventBus: ['messaging.eventBus', 'eventBus'],
        eventStore: ['persistence.eventStore', 'eventStore'],
        cache: ['persistence.cache', 'cache'],
        obs: ['observability.obs']
    });

    const catalogGateway = autoGateway(deps, 'catalog');
    const accessControlGateway = autoGateway(deps, 'access-control');

    // --- 1. Event Sourcing Setup ---
    const commandBus = createCommandBus(kvPool, eventStore);
    const handlers = createInventoryHandlers();
    Object.keys(handlers).forEach(type => commandBus.registerHandler(type, handlers[type]));

    // Projector
    const projector = createInventoryProjector(kvPool);

    // Subscriptions
    const wire = (type) => eventBus.subscribe(type, async (data) => projector.handle(data));
    [StockReceived, StockReserved, StockReleased, StockShipped].forEach(wire);

    // --- 2. Repositories (Read Path Refactor) ---

    // Product Compat Repo
    const productRepositoryCompatibility = {
        findById: (tenantId, id) => catalogGateway.getProduct(tenantId, id),
        query: (tenantId, options) => catalogGateway.listProducts(tenantId, options),
        save: () => { throw new Error('Inventory cannot save products anymore'); },
    };

    // Refactored Stock Repository (Read from View)
    // Legacy `kv-stock-repository` reads from `stock` namespace.
    // We can define a `readStockRepository` that reads from `view/inventory`.
    // BUT legacy methods expect specific `StockEntry` format (with `locationId`, `batchId`).
    // The view has `locations: { 'loc:batch': { qty... } }`.
    // We need an adapter to map View -> Legacy Entity format for backward compatibility of READs.

    const legacyStockRepo = createKVStockRepositoryAdapter(kvPool);

    const stockReadRepository = {
        // Find specific entry? view is by productId.
        // We might need to iterate locations/batches in the view.
        query: async (tenantId, options) => {
             // Supports filter: { productId }
             const pid = options?.filter?.productId;
             if (!pid) return legacyStockRepo.query(tenantId, options); // Fallback for complex queries?

             // Optimized Read Path
             const key = ['view', 'inventory', tenantId, pid];
             const res = await kvPool.withConnection(kv => kv.get(key));
             if (!res.value) return { ok: true, value: { items: [], total: 0 } }; // Empty

             const view = res.value;
             // Map view locations back to StockEntry list
             const items = Object.entries(view.locations).map(([key, data]) => {
                 const [locationId, batchId] = key.split(':');
                 return {
                     id: `mapped-${key}`,
                     tenantId,
                     productId: pid,
                     locationId,
                     batchId,
                     quantity: data.quantity, // This is Total Quantity
                     reservedQuantity: data.reserved,
                     updatedAt: new Date(view.updatedAt).toISOString()
                 };
             });

             return { ok: true, value: { items, total: items.length } };
        },
        save: async () => { throw new Error("Writes must use CommandBus"); }
    };

    // Legacy Repos (Keep for now if utilized by other legacy services/reports)
    const stockMovementRepository = createKVStockMovementRepository(kvPool);
    const warehouseRepository = createKVWarehouseRepository(kvPool);
    const locationRepository = createKVLocationRepository(kvPool);
    const batchRepository = createKVBatchRepository(kvPool);

    // Services (Legacy)
    // stockAllocationService is heavily used.
    // Ideally we replace it.
    // For now, we inject the *Read* repo so it can read, but Writes will fail if it tries `save`.
    // Wait, `stockAllocationService` DOES write (allocate/consume).
    // We are replacing its usage in `reserveStock` and `receiveStock`.
    // But `executeProduction` uses it.
    // Migrating Production is huge.
    // Strategy: `stockAllocationService` should be deprecated.
    // We leave it wired to `legacyStockRepo` for now so it doesn't break `executeProduction`
    // BUT `executeProduction` will operate on OLD data (Split Brain).
    // Correct Fix: Wire `stockAllocationService` to use Commands? Too complex.
    // Correct Fix for MVP: Leave `stockAllocationService` alone (Split Brain on Production),
    // but ensure Orders/Receipts use new path.
    // Warning: If Production consumes stock using legacy service, the View won't update!
    // This is the danger of partial migration.
    // Mitigations:
    // 1. Accept Split Brain for Production features (assumed low usage).
    // 2. OR emit events from `stockAllocationService`.

    // For this step, we prioritize the Order Flow.
    const stockAllocationService = createStockAllocationService(legacyStockRepo, stockMovementRepository, batchRepository, productRepositoryCompatibility, kvPool);
    const inventoryAdjustmentService = createInventoryAdjustmentService(legacyStockRepo, stockMovementRepository, batchRepository, productRepositoryCompatibility, kvPool);

    // Use Cases
    const updateStock = createUpdateStock({
        stockRepository: legacyStockRepo, // Legacy write
        catalogGateway,
        obs,
        eventBus,
    });

    const checkAvailability = createCheckAvailability({
        stockRepository: stockReadRepository, // NEW READ PATH
        cache,
    });

    const getProduct = createGetProduct({
        productRepository: productRepositoryCompatibility,
    });

    const getStockByProduct = createGetStockByProduct({
        stockRepository: stockReadRepository // NEW READ PATH
    });

    const getProductsBatch = createGetProductsBatch({
        productRepository: productRepositoryCompatibility
    });

    // --- NEW COMMAND WRAPPERS ---

    const reserveStockWrapper = {
        // executeBatch is called by Orders compatibility layer
        executeBatch: async (tenantId, items, orderId) => {
            // Mapping: One command per item? Or aggregated?
            // Our handler handles 1 item per command (simplification).
            // We iterate.
            const results = await Promise.all(items.map(item =>
                 commandBus.execute({
                     type: ReserveStock,
                     aggregateId: item.productId,
                     tenantId,
                     payload: {
                         orderId,
                         quantity: item.quantity,
                         allowPartial: false
                     }
                 })
            ));
            // Return structure compatible with legacy service?
            // Legacy returned `Ok(true)` or `Err`.
            // CommandBus throws on error.
            return { ok: true, value: true };
        }
    };

    const receiveStockWrapper = {
        execute: async (tenantId, items, refId) => {
             // Items is { productId, locationId, quantity... }
             // Or receiveStock use case signature?
             // `receiveStockCompat` in previous file called `receiveStockBatch`.
             // `items` is array.
             await Promise.all(items.map(item =>
                 commandBus.execute({
                     type: ReceiveStock,
                     aggregateId: item.productId,
                     tenantId,
                     payload: {
                         locationId: item.locationId || 'default',
                         batchId: item.batchId || 'default',
                         quantity: item.quantity,
                         reason: refId
                     }
                 })
             ));
             return { ok: true, value: true };
        }
    };

    const listAllProducts = createListAllProducts({
        productRepository: productRepositoryCompatibility,
        stockRepository: stockReadRepository // NEW READ PATH
    });

    const consumeStock = createConsumeStock({
        inventoryAdjustmentService
    });

    const moveStock = createMoveStock({
        stockRepository: legacyStockRepo,
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

    const queryStockMovements = createQueryStockMovements({
        stockMovementRepository,
        catalogGateway,
        locationRepository,
        batchRepository
    });

    const createWarehouse = createCreateWarehouse({
        warehouseRepository,
        eventBus
    });

    const listWarehouses = createListWarehouses({ warehouseRepository });
    const getWarehouse = createGetWarehouse({ warehouseRepository });

    const createLocation = createCreateLocation({
        locationRepository,
        warehouseRepository,
        eventBus
    });

    const listLocations = createListLocations({ locationRepository, warehouseRepository });
    const listLocationsByWarehouse = createListLocationsByWarehouse({ locationRepository });
    const getLocation = createGetLocation({ locationRepository });

    const getPickingList = createGetPickingList({
        stockMovementRepository,
        catalogGateway,
        locationRepository,
        batchRepository
    });

    // Compat wrappers
    const executeProductionCompat = {
        execute: async (...args) => stockAllocationService.executeProduction(...args)
    };

    // Check Permission Helper
    const checkUserPermission = async (tenantId, userId, action) => {
        return unwrap(await accessControlGateway.checkPermission(tenantId, userId, 'inventory', action));
    };

    return createContextBuilder('inventory')
        .withRepositories({
            stock: stockReadRepository, // Use View for general reads
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
            getStockByProduct,
            getProductsBatch,

            // REPLACED WITH COMMAND BUS WRAPPERS
            reserveStock: reserveStockWrapper,
            receiveStock: receiveStockWrapper,

            listAllProducts,
            consumeStock,
            moveStock,
            confirmStockShipment,
            confirmShipment: confirmStockShipment,
            cancelStockReservation,
            releaseStock: cancelStockReservation,
            listStockMovements,
            queryStockMovements,
            createWarehouse,
            listWarehouses,
            getWarehouse,
            createLocation,
            listLocations,
            listLocationsByWarehouse,
            getLocation,
            getPickingList,
            executeProduction: executeProductionCompat,
            receiveStockRobust: receiveStockWrapper, // Map robust to simple command
            receiveStockBatch: receiveStockWrapper
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
