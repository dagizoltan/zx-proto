import { createKVSupplierRepository } from '../../infra/persistence/kv/repositories/kv-supplier-repository.js';
import { createKVPurchaseOrderRepository } from '../../infra/persistence/kv/repositories/kv-purchase-order-repository.js';
import { createCreateSupplier, createListSuppliers } from './application/use-cases/supplier-use-cases.js';
import { createCreatePurchaseOrder, createListPurchaseOrders, createGetPurchaseOrder, createReceivePurchaseOrder } from './application/use-cases/po-use-cases.js';

export const createProcurementContext = (deps) => {
  const { persistence, inventory } = deps;

  const supplierRepo = createKVSupplierRepository(persistence.kvPool);
  const poRepo = createKVPurchaseOrderRepository(persistence.kvPool);

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
      receivePurchaseOrder: createReceivePurchaseOrder({ poRepository: poRepo, inventoryService: inventory.useCases }),
    },
  };
};
