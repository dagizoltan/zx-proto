import { createKVProductRepository } from '../../infra/persistence/kv/repositories/kv-product-repository.js';
import { createKVStockRepository } from '../../infra/persistence/kv/repositories/kv-stock-repository.js';
import { createKVStockMovementRepository } from '../../infra/persistence/kv/repositories/kv-stock-movement-repository.js';
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

export const createInventoryContext = async (deps) => {
  const { persistence, config, obs, messaging, registry } = deps;
  const { eventBus } = messaging;
  const { cache } = persistence;

  // Repositories
  const productRepository = createKVProductRepository(persistence.kvPool);
  const stockRepository = createKVStockRepository(persistence.kvPool);
  const stockMovementRepository = createKVStockMovementRepository(persistence.kvPool);

  // Domain Services
  const stockAllocationService = createStockAllocationService(stockRepository, stockMovementRepository);
  const inventoryAdjustmentService = createInventoryAdjustmentService(stockRepository, stockMovementRepository);

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

  // Access other contexts when needed
  const checkUserPermission = async (tenantId, userId, action) => {
    const accessControl = registry.get('domain.accessControl');
    return accessControl.useCases.checkPermission.execute(tenantId, userId, 'inventory', action);
  };

  return {
    name: 'inventory',

    repositories: {
      product: productRepository,
      stock: stockRepository,
    },

    services: {
      stockAllocation: stockAllocationService,
    },

    useCases: {
      createProduct,
      updateStock,
      checkAvailability,
      getProduct,
      reserveStock,
      listAllProducts,
      receiveStock,
      moveStock,
      confirmStockShipment,
      cancelStockReservation,
      listStockMovements
    },

    // Cross-context helpers
    checkUserPermission,
  };
};
