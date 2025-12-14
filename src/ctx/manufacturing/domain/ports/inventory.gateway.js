/**
 * Interface: Inventory Gateway
 * Port for accessing inventory operations from Manufacturing
 */
export const IInventoryGateway = {
  // Executes an atomic production run (consume components + produce finished good)
  executeProduction: async (tenantId, productionItems, consumptionItems, refId, userId) => { throw new Error('Not implemented'); }
};
