import { createKVSupplierRepositoryAdapter } from './infrastructure/adapters/kv-supplier-repository.adapter.js';
import { createKVPurchaseOrderRepositoryAdapter } from './infrastructure/adapters/kv-purchase-order-repository.adapter.js';
import { createCreateSupplier, createListSuppliers } from './application/use-cases/supplier-use-cases.js';
import { createCreatePurchaseOrder, createListPurchaseOrders, createGetPurchaseOrder, createReceivePurchaseOrder } from './application/use-cases/po-use-cases.js';

/**
 * Procurement Context Factory
 *
 * @param {Object} deps - Explicit DI
 * @param {Object} deps.kvPool
 * @param {Object} deps.inventoryGateway - Injected Gateway
 */
export const createProcurementContext = ({ kvPool, inventoryGateway }) => {

  const supplierRepo = createKVSupplierRepositoryAdapter(kvPool);
  const poRepo = createKVPurchaseOrderRepositoryAdapter(kvPool);

  return {
    repositories: {
      supplier: supplierRepo,
      purchaseOrder: poRepo,
    },
    useCases: {
      createSupplier: createCreateSupplier({ supplierRepository: supplierRepo }),
      listSuppliers: createListSuppliers({ supplierRepository: supplierRepo }),
      createPurchaseOrder: createCreatePurchaseOrder({ poRepository: poRepo }),
      listPurchaseOrders: createListPurchaseOrders({ poRepository: poRepo }),
      getPurchaseOrder: createGetPurchaseOrder({ poRepository: poRepo }),
      receivePurchaseOrder: createReceivePurchaseOrder({ poRepository: poRepo, inventoryService: inventoryGateway }), // Use gateway as service
    },
  };
};
