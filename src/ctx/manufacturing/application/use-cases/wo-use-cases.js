import { createWorkOrder } from '../../domain/entities/bom.js';
import { Ok, Err, isErr, unwrap } from '../../../../../lib/trust/index.js';

export const createCreateWorkOrder = ({ woRepository, bomRepository }) => {
  const execute = async (tenantId, data) => {
    // bomRepository.findById -> Result
    const bomRes = await bomRepository.findById(tenantId, data.bomId);
    if (isErr(bomRes)) return Err({ code: 'VALIDATION_ERROR', message: 'BOM not found' });

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
    return await woRepository.list(tenantId, options);
  };

  return { execute };
};

export const createCompleteWorkOrder = ({ woRepository, bomRepository, inventoryService }) => {
  const execute = async (tenantId, woId, completionData) => {
    // completionData: { locationId, inputLocationId }

    // Unwrap wo
    const woRes = await woRepository.findById(tenantId, woId);
    if (isErr(woRes)) return woRes;
    const wo = woRes.value;

    if (wo.status === 'COMPLETED') return Err({ code: 'INVALID_STATE', message: 'Work Order already completed' });

    // Unwrap bom
    const bomRes = await bomRepository.findById(tenantId, wo.bomId);
    if (isErr(bomRes)) return Err({ code: 'DATA_INTEGRITY_ERROR', message: 'Associated BOM not found' });
    const bom = bomRes.value;

    const outputLocationId = completionData.locationId; // Seeder passes locationId as output
    const inputLocationId = completionData.inputLocationId || outputLocationId;

    if (!outputLocationId) return Err({ code: 'VALIDATION_ERROR', message: 'Output location is required' });

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
        batchId: `LOT-${wo.code}`
    };

    // Execute Atomic Production
    const prodRes = await inventoryService.executeProduction.execute(tenantId, {
        consume: consumeList,
        produce: produceItem,
        reason: `WO ${wo.code}`,
        userId: completionData.userId || null
    });
    if (isErr(prodRes)) return prodRes;

    wo.status = 'COMPLETED';
    wo.completionDate = new Date().toISOString();
    wo.updatedAt = new Date().toISOString();

    return await woRepository.save(tenantId, wo);
  };

  return { execute };
};
