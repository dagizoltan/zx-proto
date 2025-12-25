import { createKVBOMRepositoryAdapter } from './infrastructure/adapters/kv-bom-repository.adapter.js';
import { createKVWorkOrderRepositoryAdapter } from './infrastructure/adapters/kv-work-order-repository.adapter.js';
import { createCreateBOM, createListBOMs } from './application/use-cases/bom-use-cases.js';
import { createCreateWorkOrder, createListWorkOrders, createCompleteWorkOrder } from './application/use-cases/wo-use-cases.js';
import { resolveDependencies } from '../../utils/registry/dependency-resolver.js';
import { createContextBuilder } from '../../utils/registry/context-builder.js';
import { autoGateway } from '../../utils/registry/gateway-factory.js';

import { createCommandBus } from '../../infra/command-bus/index.js';
import { createManufacturingHandlers, ScheduleProduction, CompleteProduction } from './domain/index.js';
import { createManufacturingProcessManager } from './process-manager.js';

export const createManufacturingContext = async (deps) => {
  const { kvPool, eventBus, eventStore } = resolveDependencies(deps, {
    kvPool: ['persistence.kvPool', 'kvPool'],
    eventBus: ['messaging.eventBus', 'eventBus'],
    eventStore: ['persistence.eventStore', 'eventStore']
  });

  const inventoryGateway = autoGateway(deps, 'inventory');

  // --- Event Sourcing Setup ---
  const commandBus = createCommandBus(kvPool, eventStore);
  const handlers = createManufacturingHandlers();
  Object.keys(handlers).forEach(t => commandBus.registerHandler(t, handlers[t]));

  // Inventory Bus (Shared infra)
  const inventoryCommandBus = createCommandBus(kvPool, eventStore);
  const { createInventoryHandlers } = await import('../inventory/domain/index.js');
  const invHandlers = createInventoryHandlers();
  Object.keys(invHandlers).forEach(t => inventoryCommandBus.registerHandler(t, invHandlers[t]));

  const processManager = createManufacturingProcessManager(commandBus, inventoryCommandBus, kvPool); // Needs kvPool

  // Subscriptions
  // REMOVED OutboxWorker instantiation (Centralized in MessagingContext)

  eventBus.subscribe('ProductionCompleted', async (data) => processManager.handle(data));

  // --- Legacy Adapters ---
  const bomRepo = createKVBOMRepositoryAdapter(kvPool);
  const woRepo = createKVWorkOrderRepositoryAdapter(kvPool);

  // --- New Command Wrappers for Legacy Use Cases ---
  const completeWorkOrderLegacy = createCompleteWorkOrder({ woRepository: woRepo, bomRepository: bomRepo, inventoryService: inventoryGateway });

  const completeWorkOrderWrapper = {
      execute: async (tenantId, id, actualQty) => {
          // 1. Do Legacy Update (Status -> DONE)
          const res = await completeWorkOrderLegacy.execute(tenantId, id, actualQty);
          if (!res.ok) return res;

          // 2. Dispatch Event Command
          const wo = await woRepo.findById(tenantId, id);
          if (wo) {
             // Lazy Migration:
             // 1. Schedule (Backdate)
             await commandBus.execute({
                 type: ScheduleProduction,
                 aggregateId: id, // Use WO ID as Aggregate ID
                 tenantId,
                 payload: {
                     productionOrderId: id,
                     productId: wo.productId,
                     quantity: wo.quantity,
                     rawMaterials: [],
                     dueDate: null
                 }
             });

             // 2. Complete
             await commandBus.execute({
                 type: CompleteProduction,
                 aggregateId: id,
                 tenantId,
                 payload: {
                     actualQuantity: actualQty || wo.quantity
                 }
             });
          }
          return res;
      }
  };

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
      completeWorkOrder: completeWorkOrderWrapper, // Swapped
    })
    .build();
};

export const ManufacturingContext = {
    name: 'manufacturing',
    dependencies: ['infra.persistence', 'domain.inventory', 'infra.messaging'],
    factory: createManufacturingContext
};
