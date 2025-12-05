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

    // 1. Consume Raw Materials (Deduct Stock)
    for (const component of bom.components) {
      const requiredQty = component.quantity * wo.quantity;

      // Use correct consumeStock use case
      await inventoryService.consumeStock.execute(tenantId, {
        productId: component.productId,
        locationId: inputLocationId, // Use input location
        quantity: requiredQty,
        reason: `Consumed for WO ${wo.code}`,
        userId: completionData.userId || null
      });
    }

    // 2. Produce Finished Good (Add Stock)
    await inventoryService.receiveStock.execute(tenantId, {
      productId: bom.productId,
      locationId: outputLocationId, // Use output location
      quantity: wo.quantity,
      batchId: null,
      reason: `Produced by WO ${wo.code}`
    });

    wo.status = 'COMPLETED';
    wo.completionDate = new Date().toISOString();
    wo.updatedAt = new Date().toISOString();

    return await woRepository.save(tenantId, wo);
  };

  return { execute };
};
