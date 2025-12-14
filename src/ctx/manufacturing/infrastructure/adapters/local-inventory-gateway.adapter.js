import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';

/**
 * Adapter: Local Inventory Gateway for Manufacturing
 * Wraps the local Inventory Context
 *
 * @param {Object} inventoryContext
 */
export const createLocalInventoryGatewayAdapter = (inventoryContext) => {
  return {
    // Mapping methods needed by completeWorkOrder.
    // Originally it accessed `inventory.services.stockAllocation`

    executeProduction: async (tenantId, productionItems, consumptionItems, refId, userId) => {
      if (!inventoryContext) {
        return Err({ code: 'INVENTORY_UNAVAILABLE', message: 'Inventory context not available' });
      }

      try {
        // Map arguments to the object structure expected by stockAllocationService.executeProduction
        return await inventoryContext.useCases.executeProduction.execute(tenantId, {
           produce: productionItems, // Single item object
           consume: consumptionItems, // Array of items
           reason: refId,
           userId: userId || null
        });
      } catch (error) {
        return Err({ code: 'INVENTORY_ERROR', message: error.message });
      }
    }
  };
};
