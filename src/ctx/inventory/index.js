import { createKVProductRepository } from '../../infra/persistence/kv/repositories/kv-product-repository.js';
import { createKVStockRepository } from '../../infra/persistence/kv/repositories/kv-stock-repository.js';
import { createStockAllocationService } from './domain/services/stock-allocation-service.js';
import { createCreateProduct } from './application/use-cases/create-product.js';
import { createUpdateStock } from './application/use-cases/update-stock.js';
import { createCheckAvailability } from './application/use-cases/check-availability.js';
import { createGetProduct } from './application/use-cases/get-product.js';
import { createReserveStock } from './application/use-cases/reserve-stock.js';
import { createListAllProducts } from './application/use-cases/list-all-products.js';

export const createInventoryContext = async (deps) => {
  const { persistence, config, obs, messaging, registry } = deps;
  const { eventBus } = messaging;
  const { cache } = persistence;

  // Repositories
  const productRepository = createKVProductRepository(persistence.kvPool);
  const stockRepository = createKVStockRepository(persistence.kvPool);

  // Domain Services
  const stockAllocationService = createStockAllocationService(stockRepository);

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
      listAllProducts
    },

    // Cross-context helpers
    checkUserPermission,
  };
};
