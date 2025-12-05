import { createKVProductRepository } from '../../infra/persistence/kv/repositories/kv-product-repository.js';
import { createKVStockRepository } from '../../infra/persistence/kv/repositories/kv-stock-repository.js';
import { createKVStockMovementRepository } from '../../infra/persistence/kv/repositories/kv-stock-movement-repository.js';
import { createKVWarehouseRepository } from '../../infra/persistence/kv/repositories/kv-warehouse-repository.js';
import { createKVLocationRepository } from '../../infra/persistence/kv/repositories/kv-location-repository.js';
import { createKVBatchRepository } from '../../infra/persistence/kv/repositories/kv-batch-repository.js';

import { createStockAllocationService } from './domain/services/stock-allocation-service.js';
import { createInventoryAdjustmentService } from './domain/services/inventory-adjustment-service.js';

import { createCreateProduct } from './application/use-cases/create-product.js';
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

export const createInventoryContext = async (deps) => {
  const { persistence, config, obs, messaging, registry } = deps;
  const { eventBus } = messaging;
  const { cache } = persistence;

  // Repositories
  const productRepository = createKVProductRepository(persistence.kvPool);
  const stockRepository = createKVStockRepository(persistence.kvPool);
  const stockMovementRepository = createKVStockMovementRepository(persistence.kvPool);
  const warehouseRepository = createKVWarehouseRepository(persistence.kvPool);
  const locationRepository = createKVLocationRepository(persistence.kvPool);
  const batchRepository = createKVBatchRepository(persistence.kvPool);

  // Domain Services
  const stockAllocationService = createStockAllocationService(stockRepository, stockMovementRepository, batchRepository, productRepository);
  const inventoryAdjustmentService = createInventoryAdjustmentService(stockRepository, stockMovementRepository, batchRepository, productRepository);

  // Use Cases
  const createProduct = createCreateProduct({
    productRepository,
    obs,
    eventBus,
  });

  const updateStock = createUpdateStock({
    productRepository,
    stockAllocationService,
    obs,
    eventBus,
  });

  const checkAvailability = createCheckAvailability({
    stockRepository,
    cache,
  });

  const getProduct = createGetProduct({
    productRepository,
  });

  const reserveStock = createReserveStock({
    stockAllocationService
  });

  const listAllProducts = createListAllProducts({
      productRepository
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
      warehouseRepository
  });

  const createLocation = createCreateLocation({
      locationRepository,
      warehouseRepository
  });

  // Access other contexts when needed
  const checkUserPermission = async (tenantId, userId, action) => {
    const accessControl = registry.get('domain.accessControl');
    return accessControl.useCases.checkPermission.execute(tenantId, userId, 'inventory', action);
  };

  // Expose services directly for cross-domain orchestration (e.g., Manufacturing, Procurement)
  // This is a "Service-to-Service" communication pattern
  const executeProduction = stockAllocationService.executeProduction;
  const receiveStockRobust = stockAllocationService.receiveStockRobust;

  return {
    name: 'inventory',

    repositories: {
      product: productRepository,
      stock: stockRepository,
      warehouse: warehouseRepository,
      location: locationRepository,
      batch: batchRepository,
      stockMovement: stockMovementRepository,
    },

    services: {
      stockAllocation: stockAllocationService,
      executeProduction, // Exposed
      receiveStockRobust, // Exposed
    },

    useCases: {
      createProduct,
      updateStock,
      checkAvailability,
      getProduct,
      reserveStock,
      listAllProducts,
      receiveStock,
      consumeStock,
      moveStock,
      confirmStockShipment,
      cancelStockReservation,
      listStockMovements,
      createWarehouse,
      createLocation,
    },

    // Cross-context helpers
    checkUserPermission,
  };
};
