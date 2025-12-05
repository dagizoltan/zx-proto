import { createWorkOrder } from '../../domain/entities/bom.js';

export const createCreateWorkOrder = ({ woRepository, bomRepository }) => {
  const execute = async (tenantId, data) => {
    const bom = await bomRepository.findById(tenantId, data.bomId);
    if (!bom) throw new Error('BOM not found');

    const wo = createWorkOrder({
      ...data,
      id: crypto.randomUUID(),
      tenantId,
      code: data.code || `WO-${Date.now()}`,
    });
    return await woRepository.save(tenantId, wo);
  };

  return { execute };
};

export const createListWorkOrders = ({ woRepository }) => {
  const execute = async (tenantId, options) => {
    return await woRepository.findAll(tenantId, options);
  };

  return { execute };
};

export const createCompleteWorkOrder = ({ woRepository, bomRepository, inventoryService }) => {
  const execute = async (tenantId, woId, completionData) => {
    // completionData: { locationId, inputLocationId }
    // locationId = Output Location (Finished Goods)
    // inputLocationId = Input Location (Raw Materials). Defaults to Output if not provided.

    const wo = await woRepository.findById(tenantId, woId);
    if (!wo) throw new Error('Work Order not found');
    if (wo.status === 'COMPLETED') throw new Error('Work Order already completed');

    const bom = await bomRepository.findById(tenantId, wo.bomId);
    if (!bom) throw new Error('Associated BOM not found');

    const outputLocationId = completionData.locationId;
    const inputLocationId = completionData.inputLocationId || outputLocationId;

    if (!outputLocationId) throw new Error('Output location is required');

    // Prepare Production Plan
    const consumeList = bom.components.map(component => ({
        productId: component.productId,
        quantity: component.quantity * wo.quantity,
        locationId: inputLocationId
    }));

    const produceItem = {
        productId: bom.productId,
        quantity: wo.quantity,
        locationId: outputLocationId,
        batchId: `LOT-${wo.code}` // Traceability: Link Batch to WO Code
    };

    // Execute Atomic Production via Use Case Interface
    await inventoryService.executeProduction.execute(tenantId, {
        consume: consumeList,
        produce: produceItem,
        reason: `WO ${wo.code}`,
        userId: completionData.userId || null
    });

    wo.status = 'COMPLETED';
    wo.completionDate = new Date().toISOString();
    wo.updatedAt = new Date().toISOString();

    return await woRepository.save(tenantId, wo);
  };

  return { execute };
};
