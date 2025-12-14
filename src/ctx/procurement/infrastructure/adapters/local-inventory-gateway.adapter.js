import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';

/**
 * Adapter: Local Inventory Gateway for Procurement
 * Wraps the local Inventory Context
 *
 * @param {Object} inventoryContext
 */
export const createLocalInventoryGatewayAdapter = (inventoryContext) => {
  return {
    receiveStock: async (tenantId, items, refId) => {
      if (!inventoryContext) {
        return Err({ code: 'INVENTORY_UNAVAILABLE', message: 'Inventory context not available' });
      }

      // Maps to inventory.useCases.receiveStock or similar
      // Need to verify exact method signature in Inventory.
      // Assuming useCases.receiveStock.execute(tenantId, items, refId) based on naming.
      // But verify strictly.
      try {
          // Inventory context has receiveStockBatch use case
          return await inventoryContext.useCases.receiveStockBatch.execute(tenantId, {
            items,
            reason: refId // Mapping refId to reason as per original usage
          });
      } catch (error) {
          return Err({ code: 'INVENTORY_ERROR', message: error.message });
      }
    }
  };
};
