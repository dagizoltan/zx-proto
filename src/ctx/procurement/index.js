import { createKVSupplierRepositoryAdapter } from './infrastructure/adapters/kv-supplier-repository.adapter.js';
import { createKVPurchaseOrderRepositoryAdapter } from './infrastructure/adapters/kv-purchase-order-repository.adapter.js';
import { createCreateSupplier, createListSuppliers } from './application/use-cases/supplier-use-cases.js';
import { createCreatePurchaseOrder, createListPurchaseOrders, createGetPurchaseOrder, createReceivePurchaseOrder } from './application/use-cases/po-use-cases.js';
import { resolveDependencies } from '../../utils/registry/dependency-resolver.js';
import { createContextBuilder } from '../../utils/registry/context-builder.js';
import { autoGateway } from '../../utils/registry/gateway-factory.js';

export const createProcurementContext = async (deps) => {
  const { kvPool } = resolveDependencies(deps, {
    kvPool: ['persistence.kvPool', 'kvPool']
  });

  const inventoryGateway = autoGateway(deps, 'inventory');

  const supplierRepo = createKVSupplierRepositoryAdapter(kvPool);
  const poRepo = createKVPurchaseOrderRepositoryAdapter(kvPool);

  return createContextBuilder('procurement')
    .withRepositories({
      supplier: supplierRepo,
      purchaseOrder: poRepo,
    })
    .withUseCases({
      createSupplier: createCreateSupplier({ supplierRepository: supplierRepo }),
      listSuppliers: createListSuppliers({ supplierRepository: supplierRepo }),
      createPurchaseOrder: createCreatePurchaseOrder({ poRepository: poRepo }),
      listPurchaseOrders: createListPurchaseOrders({ poRepository: poRepo }),
      getPurchaseOrder: createGetPurchaseOrder({ poRepository: poRepo }),
      receivePurchaseOrder: createReceivePurchaseOrder({ poRepository: poRepo, inventoryService: inventoryGateway }),
    })
    .build();
};

export const ProcurementContext = {
    name: 'procurement',
    dependencies: ['infra.persistence', 'domain.inventory'],
    factory: createProcurementContext
};
