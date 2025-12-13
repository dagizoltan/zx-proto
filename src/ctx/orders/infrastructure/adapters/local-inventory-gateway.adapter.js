import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';

/**
 * Adapter: Local Inventory Gateway
 * Wraps the local Inventory Context to implement IInventoryGateway
 */
export const createLocalInventoryGatewayAdapter = (registry) => {
  return {
    reserveStock: async (tenantId, items, orderId) => {
      const inventory = registry.get('domain.inventory');
      if (!inventory) {
        return Err({ code: 'INVENTORY_UNAVAILABLE', message: 'Inventory context not available' });
      }

      try {
        const result = await inventory.useCases.reserveStock.executeBatch(
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
      const inventory = registry.get('domain.inventory');
      if (!inventory) {
        return Err({ code: 'INVENTORY_UNAVAILABLE', message: 'Inventory context not available' });
      }

      try {
        await inventory.useCases.cancelStockReservation.execute(tenantId, orderId);
        return Ok(true);
      } catch (error) {
        return Err({ code: 'INVENTORY_ERROR', message: error.message });
      }
    },

    confirmShipment: async (tenantId, orderId, items) => {
      const inventory = registry.get('domain.inventory');
      if (!inventory) {
        return Err({ code: 'INVENTORY_UNAVAILABLE', message: 'Inventory context not available' });
      }

      try {
        await inventory.useCases.confirmStockShipment.execute(tenantId, orderId, items);
        return Ok(true);
      } catch (error) {
        return Err({ code: 'INVENTORY_ERROR', message: error.message });
      }
    }
  };
};
