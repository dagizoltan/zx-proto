import { createPurchaseOrder } from '../../domain/entities/supplier.js';
import { Ok, Err, isErr, unwrap } from '../../../../../../lib/trust/index.js';

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
    // findAll -> list
    const res = await poRepository.list(tenantId, options);
    // Legacy support: unwrapping or returning Result?
    // Given handlers expect items, but if I return Result, handlers need update.
    // Assuming Handlers unwrapping (most handlers I updated unwrap).
    // Or I should unwrap here to match legacy signature "return items"?
    // "Rebase" implies updating everything to Result.
    // I updated seeders to handle Result.
    // So I should return Result.
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
    // receiveData: { locationId, items: [{ productId, quantity }] }

    // Unwrap findById
    const poRes = await poRepository.findById(tenantId, poId);
    if (isErr(poRes)) return poRes;
    const po = poRes.value;

    if (po.status === 'RECEIVED' || po.status === 'CANCELLED') {
        return Err({ code: 'INVALID_STATE', message: 'PO already closed' });
    }

    // Update PO item quantities
    const inventoryItems = [];

    // Assuming po.items exists and has structure
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

    // Atomic Inventory Update
    if (inventoryItems.length > 0) {
      // receiveStockBatch -> execute
      const invRes = await inventoryService.receiveStockBatch.execute(tenantId, {
        items: inventoryItems,
        reason: `Received PO ${po.code}`
      });
      if (isErr(invRes)) return invRes;
    }

    // Check if fully received
    const allReceived = po.items.every(i => (i.receivedQuantity || 0) >= i.quantity);
    po.status = allReceived ? 'RECEIVED' : 'PARTIAL'; // 'PARTIAL' or 'ISSUED'? Original code used 'PARTIAL' (not in Enum DRAFT/ISSUED/RECEIVED/CANCELLED).
    // Schema in procurement.schema.js: status: z.enum(['DRAFT', 'ISSUED', 'RECEIVED', 'CANCELLED']).
    // 'PARTIAL' is invalid according to Schema!
    // I should use 'ISSUED' for partial, or update Schema.
    // Ideally 'PARTIALLY_RECEIVED'.
    // Given the constraints, I'll stick to 'ISSUED' if not fully received, or 'RECEIVED'.
    // Or I should update Schema to support PARTIAL.
    // Let's check Schema.
    // Step 4 created schema.
    // PurchaseOrderSchema ... status: z.enum(['DRAFT', 'ISSUED', 'RECEIVED', 'CANCELLED']).
    // So 'PARTIAL' will fail validation on save.
    // I will use 'ISSUED' for now.

    po.status = allReceived ? 'RECEIVED' : 'ISSUED';
    po.updatedAt = new Date().toISOString();

    const saved = await poRepository.save(tenantId, po);
    return saved;
  };

  return { execute };
};
