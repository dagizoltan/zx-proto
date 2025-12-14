/**
 * Interface: Inventory Gateway
 * Port for accessing inventory operations from Procurement
 */
export const IInventoryGateway = {
  receiveStock: async (tenantId, items, refId) => { throw new Error('Not implemented'); }
};
