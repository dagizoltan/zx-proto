import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';

/**
 * Adapter: Local Inventory Gateway
 * Wraps the local Inventory Context to implement IInventoryGateway
 *
 * @param {Object} inventoryContext - The actual Inventory Context instance
 */
export const createLocalInventoryGatewayAdapter = (inventoryContext) => {
  return {
    reserveStock: async (tenantId, items, orderId) => {
      if (!inventoryContext) {
        return Err({ code: 'INVENTORY_UNAVAILABLE', message: 'Inventory context not available' });
      }

      try {
        const result = await inventoryContext.useCases.reserveStock.executeBatch(
          tenantId,
          items,
          orderId
        );
        return result;
      } catch (error) {
        return Err({ code: 'INVENTORY_ERROR', message: error.message });
      }
    },

    releaseStock: async (tenantId, orderId) => {
      if (!inventoryContext) {
        return Err({ code: 'INVENTORY_UNAVAILABLE', message: 'Inventory context not available' });
      }

      try {
        await inventoryContext.useCases.cancelStockReservation.execute(tenantId, orderId);
        return Ok(true);
      } catch (error) {
        return Err({ code: 'INVENTORY_ERROR', message: error.message });
      }
    },

    confirmShipment: async (tenantId, orderId, items) => {
      if (!inventoryContext) {
        return Err({ code: 'INVENTORY_UNAVAILABLE', message: 'Inventory context not available' });
      }

      try {
        await inventoryContext.useCases.confirmStockShipment.execute(tenantId, orderId, items);
        return Ok(true);
      } catch (error) {
        return Err({ code: 'INVENTORY_ERROR', message: error.message });
      }
    }
  };
};
