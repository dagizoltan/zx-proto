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

import { createLocalCatalogGatewayAdapter } from './infrastructure/adapters/local-catalog-gateway.adapter.js';

export const createInventoryContext = async (deps) => {
  const { persistence, config, obs, messaging, registry } = deps;
  const { eventBus } = messaging;
  const { cache } = persistence;

  // Catalog Gateway
  const catalogGateway = createLocalCatalogGatewayAdapter(registry);

  // Product Compat Repo
  const productRepositoryCompatibility = {
      findById: (tenantId, id) => catalogGateway.getProduct(tenantId, id),
      query: (tenantId, options) => catalogGateway.list(tenantId, options),
      save: () => { throw new Error('Inventory cannot save products anymore'); },
  };

  const stockRepository = createKVStockRepositoryAdapter(persistence.kvPool);

  // Legacy Repos
  const stockMovementRepository = createKVStockMovementRepository(persistence.kvPool);
  const warehouseRepository = createKVWarehouseRepository(persistence.kvPool);
  const locationRepository = createKVLocationRepository(persistence.kvPool);
  const batchRepository = createKVBatchRepository(persistence.kvPool);

  // Services
  const stockAllocationService = createStockAllocationService(stockRepository, stockMovementRepository, batchRepository, productRepositoryCompatibility, persistence.kvPool);
  const inventoryAdjustmentService = createInventoryAdjustmentService(stockRepository, stockMovementRepository, batchRepository, productRepositoryCompatibility, persistence.kvPool);

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
      registry
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

  const checkUserPermission = async (tenantId, userId, action) => {
    const accessControl = registry.get('domain.access-control');
    return unwrap(await accessControl.useCases.checkPermission.execute(tenantId, userId, 'inventory', action));
  };

  return {
    name: 'inventory',

    repositories: {
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
