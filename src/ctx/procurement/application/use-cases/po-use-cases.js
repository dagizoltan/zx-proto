import { createPurchaseOrder } from '../../domain/entities/supplier.js';

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
    return await poRepository.save(tenantId, po);
  };

  return { execute };
};

export const createListPurchaseOrders = ({ poRepository }) => {
  const execute = async (tenantId, options) => {
    return await poRepository.findAll(tenantId, options);
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
    // receiveData: { locationId, items: [{ productId, quantity }] }
    const po = await poRepository.findById(tenantId, poId);
    if (!po) throw new Error('PO not found');
    if (po.status === 'RECEIVED' || po.status === 'CANCELLED') throw new Error('PO already closed');

    // Iterate items
    for (const receivedItem of receiveData.items) {
      const poItem = po.items.find(i => i.productId === receivedItem.productId);
      if (poItem) {
        poItem.receivedQuantity += receivedItem.quantity;
      }

      // Use Robust Reception via Use Case Interface
      await inventoryService.receiveStockRobust.execute(tenantId, {
        productId: receivedItem.productId,
        locationId: receiveData.locationId,
        quantity: receivedItem.quantity,
        batchId: null, // Will generate unique batch
        reason: `Received PO ${po.code}`
      });
    }

    // Check if fully received
    const allReceived = po.items.every(i => i.receivedQuantity >= i.quantity);
    po.status = allReceived ? 'RECEIVED' : 'PARTIAL';
    po.updatedAt = new Date().toISOString();

    const saved = await poRepository.save(tenantId, po);
    return saved || po;
  };

  return { execute };
};
