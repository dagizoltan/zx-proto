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
import { createGetProductsBatch } from './application/use-cases/get-products-batch.js';
import { createGetPickingList } from './application/use-cases/get-picking-list.js';
import { unwrap } from '../../../lib/trust/index.js';

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
  // Inject kvPool for transaction support
  const stockAllocationService = createStockAllocationService(stockRepository, stockMovementRepository, batchRepository, productRepository, persistence.kvPool);
  const inventoryAdjustmentService = createInventoryAdjustmentService(stockRepository, stockMovementRepository, batchRepository, productRepository, persistence.kvPool);

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

  const getProductsBatch = createGetProductsBatch({
      productRepository
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
      registry
  });

  // WRAPPER USE CASES for Cross-Domain Service Calls
  const executeProduction = {
      execute: async (...args) => stockAllocationService.executeProduction(...args)
  };

  const receiveStockRobust = {
      execute: async (...args) => stockAllocationService.receiveStockRobust(...args)
  };

  const receiveStockBatch = {
      execute: async (...args) => stockAllocationService.receiveStockBatch(...args)
  };

  const checkUserPermission = async (tenantId, userId, action) => {
    const accessControl = registry.get('domain.access-control');
    // Unwrap the result to return boolean, maintaining interface.
    // If it's an error (e.g. system failure), unwrap throws, which is safe/secure (fails closed).
    return unwrap(await accessControl.useCases.checkPermission.execute(tenantId, userId, 'inventory', action));
  };

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
    },

    useCases: {
      createProduct,
      updateStock,
      checkAvailability,
      getProduct,
      getProductsBatch,
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
      getPickingList,
      executeProduction,
      receiveStockRobust,
      receiveStockBatch
    },

    checkUserPermission,
  };
};
