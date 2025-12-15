import { createKVBOMRepositoryAdapter } from './infrastructure/adapters/kv-bom-repository.adapter.js';
import { createKVWorkOrderRepositoryAdapter } from './infrastructure/adapters/kv-work-order-repository.adapter.js';
import { createCreateBOM, createListBOMs } from './application/use-cases/bom-use-cases.js';
import { createCreateWorkOrder, createListWorkOrders, createCompleteWorkOrder } from './application/use-cases/wo-use-cases.js';
import { resolveDependencies } from '../../utils/registry/dependency-resolver.js';
import { createContextBuilder } from '../../utils/registry/context-builder.js';
import { autoGateway } from '../../utils/registry/gateway-factory.js';

export const createManufacturingContext = async (deps) => {
  const { kvPool } = resolveDependencies(deps, {
    kvPool: ['persistence.kvPool', 'kvPool']
  });

  const inventoryGateway = autoGateway(deps, 'inventory');

  const bomRepo = createKVBOMRepositoryAdapter(kvPool);
  const woRepo = createKVWorkOrderRepositoryAdapter(kvPool);

  return createContextBuilder('manufacturing')
    .withRepositories({
      bom: bomRepo,
      workOrder: woRepo,
    })
    .withUseCases({
      createBOM: createCreateBOM({ bomRepository: bomRepo }),
      listBOMs: createListBOMs({ bomRepository: bomRepo }),
      createWorkOrder: createCreateWorkOrder({ woRepository: woRepo, bomRepository: bomRepo }),
      listWorkOrders: createListWorkOrders({ woRepository: woRepo }),
      completeWorkOrder: createCompleteWorkOrder({ woRepository: woRepo, bomRepository: bomRepo, inventoryService: inventoryGateway }),
    })
    .build();
};

export const ManufacturingContext = {
    name: 'manufacturing',
    dependencies: ['infra.persistence', 'domain.inventory'],
    factory: createManufacturingContext
};
