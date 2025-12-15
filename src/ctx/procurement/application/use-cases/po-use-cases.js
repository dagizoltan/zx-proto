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
    const res = await poRepository.query(tenantId, options);
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

    // Create new items array with updated quantities
    const newItems = po.items.map(item => {
        const receivedItem = receiveData.items.find(ri => ri.productId === item.productId);
        if (receivedItem) {
            inventoryItems.push({
                productId: receivedItem.productId,
                locationId: receiveData.locationId,
                quantity: receivedItem.quantity,
                batchId: null,
            });
            return {
                ...item,
                receivedQuantity: (item.receivedQuantity || 0) + receivedItem.quantity
            };
        }
        return item;
    });

    if (inventoryItems.length > 0) {
      // Changed: inventoryService is now IInventoryGateway
      const invRes = await inventoryService.receiveStock(tenantId, inventoryItems, poId);
      if (isErr(invRes)) return invRes;
    }

    const allReceived = newItems.every(i => (i.receivedQuantity || 0) >= i.quantity);
    const newStatus = allReceived ? 'RECEIVED' : 'ISSUED';

    const updatedPO = createPurchaseOrder({
        ...po,
        items: newItems,
        status: newStatus,
        updatedAt: new Date().toISOString()
    });

    const saved = await poRepository.save(tenantId, updatedPO);
    return saved;
  };

  return { execute };
};
