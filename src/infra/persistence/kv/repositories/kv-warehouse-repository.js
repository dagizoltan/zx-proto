import { createBaseRepository } from './base-repository.js';

export const createKVWarehouseRepository = (kvPool) => {
  // Use Base Repository for standard CRUD
  const base = createBaseRepository(kvPool, 'warehouses');

  // Custom Delete with Cascade Check
  const deleteWarehouse = async (tenantId, warehouseId) => {
    return kvPool.withConnection(async (kv) => {
      // Check for locations (Cascade Protection)
      const locationIter = kv.list({ prefix: ['tenants', tenantId, 'locations'] });
      let hasLocations = false;
      for await (const res of locationIter) {
          if (res.value.warehouseId === warehouseId) {
              hasLocations = true;
              break;
          }
      }

      if (hasLocations) {
        throw new Error(
          `Cannot delete warehouse with existing locations. Delete locations first or reassign stock.`
        );
      }

      // Safe to delete using base method or direct delete
      await base.deleteById(tenantId, warehouseId);
    });
  };

  // We expose standard base methods + custom override (if we wanted to override 'delete')
  // But here 'delete' is a new method name in the interface (base has deleteById).
  // The interface expects { save, findById, findAll, delete } usually?
  // Previous file exported: { save, findById, findAll, delete: deleteWarehouse }

  return {
      save: base.save,
      findById: base.findById,
      findAll: async (tenantId) => {
          // Wrap base.findAll to return just items array (legacy signature compatibility)
          // The base returns { items, nextCursor }
          // The previous warehouse repo returned just items array.
          const res = await base.findAll(tenantId, { limit: 1000 }); // High limit for legacy behavior
          return res.items;
      },
      delete: deleteWarehouse
  };
};
