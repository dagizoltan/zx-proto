/**
 * Interface: Inventory Gateway
 * Port for accessing inventory operations
 */
export const IInventoryGateway = {
  reserveStock: async (tenantId, items, orderId) => { throw new Error('Not implemented'); },
  releaseStock: async (tenantId, orderId) => { throw new Error('Not implemented'); },
  confirmShipment: async (tenantId, orderId, items) => { throw new Error('Not implemented'); }
};
