import { createKVBOMRepository } from '../../infra/persistence/kv/repositories/kv-bom-repository.js';
import { createKVWorkOrderRepository } from '../../infra/persistence/kv/repositories/kv-work-order-repository.js';
import { createCreateBOM, createListBOMs } from './application/use-cases/bom-use-cases.js';
import { createCreateWorkOrder, createListWorkOrders, createCompleteWorkOrder } from './application/use-cases/wo-use-cases.js';
import { Ok, Err, isErr } from '../../../lib/trust/index.js'; // Ensure imports for result handling if needed by factory wrappers

export const createManufacturingContext = (deps) => {
  const { persistence, inventory } = deps;

  const bomRepo = createKVBOMRepository(persistence.kvPool);
  const woRepo = createKVWorkOrderRepository(persistence.kvPool);

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
      completeWorkOrder: createCompleteWorkOrder({ woRepository: woRepo, bomRepository: bomRepo, inventoryService: inventory.services.stockAllocation }), // Correct service injection
    },
  };
};
