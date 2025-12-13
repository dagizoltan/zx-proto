import { createKVBOMRepositoryAdapter } from './infrastructure/adapters/kv-bom-repository.adapter.js';
import { createKVWorkOrderRepositoryAdapter } from './infrastructure/adapters/kv-work-order-repository.adapter.js';
import { createCreateBOM, createListBOMs } from './application/use-cases/bom-use-cases.js';
import { createCreateWorkOrder, createListWorkOrders, createCompleteWorkOrder } from './application/use-cases/wo-use-cases.js';

export const createManufacturingContext = (deps) => {
  const { persistence, inventory } = deps;

  const bomRepo = createKVBOMRepositoryAdapter(persistence.kvPool);
  const woRepo = createKVWorkOrderRepositoryAdapter(persistence.kvPool);

  return {
    repositories: {
      bom: bomRepo,
      workOrder: woRepo,
    },
    useCases: {
      createBOM: createCreateBOM({ bomRepository: bomRepo }),
      listBOMs: createListBOMs({ bomRepository: bomRepo }),
      createWorkOrder: createCreateWorkOrder({ woRepository: woRepo, bomRepository: bomRepo }),
      listWorkOrders: createListWorkOrders({ woRepository: woRepo }),
      completeWorkOrder: createCompleteWorkOrder({ woRepository: woRepo, bomRepository: bomRepo, inventoryService: inventory.services.stockAllocation }),
    },
  };
};
