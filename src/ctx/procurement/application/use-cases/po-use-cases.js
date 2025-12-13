import { createPurchaseOrder } from '../../domain/entities/purchase-order.js';
import { Ok, Err, isErr, unwrap } from '../../../../../lib/trust/index.js';

export const createCreatePurchaseOrder = ({ poRepository }) => {
  const execute = async (tenantId, data) => {
    const totalCost = data.items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);

    const po = createPurchaseOrder({
      ...data,
      id: crypto.randomUUID(),
      tenantId,
      code: data.code || `PO-${Date.now()}`,
      totalCost,
    });
    // save returns Result
    return await poRepository.save(tenantId, po);
  };

  return { execute };
};

export const createListPurchaseOrders = ({ poRepository }) => {
  const execute = async (tenantId, options) => {
    const res = await poRepository.list(tenantId, options);
    return res;
  };

  return { execute };
};

export const createGetPurchaseOrder = ({ poRepository }) => {
  const execute = async (tenantId, id) => {
    return await poRepository.findById(tenantId, id);
  };

  return { execute };
};

export const createReceivePurchaseOrder = ({ poRepository, inventoryService }) => {
  const execute = async (tenantId, poId, receiveData) => {
    const poRes = await poRepository.findById(tenantId, poId);
    if (isErr(poRes)) return poRes;
    const po = poRes.value;

    if (po.status === 'RECEIVED' || po.status === 'CANCELLED') {
        return Err({ code: 'INVALID_STATE', message: 'PO already closed' });
    }

    const inventoryItems = [];

    for (const receivedItem of receiveData.items) {
      const poItem = po.items.find(i => i.productId === receivedItem.productId);
      if (poItem) {
        poItem.receivedQuantity = (poItem.receivedQuantity || 0) + receivedItem.quantity;
      }

      inventoryItems.push({
        productId: receivedItem.productId,
        locationId: receiveData.locationId,
        quantity: receivedItem.quantity,
        batchId: null,
      });
    }

    if (inventoryItems.length > 0) {
      const invRes = await inventoryService.receiveStockBatch.execute(tenantId, {
        items: inventoryItems,
        reason: `Received PO ${po.code}`
      });
      if (isErr(invRes)) return invRes;
    }

    const allReceived = po.items.every(i => (i.receivedQuantity || 0) >= i.quantity);
    po.status = allReceived ? 'RECEIVED' : 'ISSUED';
    po.updatedAt = new Date().toISOString();

    const saved = await poRepository.save(tenantId, po);
    return saved;
  };

  return { execute };
};
