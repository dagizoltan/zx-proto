import { createWarehouse as createWarehouseEntity } from '../../domain/entities/warehouse.js';

export const createCreateWarehouse = ({ warehouseRepository, eventBus }) => {
  const execute = async (tenantId, data) => {
    const warehouse = createWarehouseEntity({
      id: crypto.randomUUID(),
      tenantId,
      createdAt: new Date().toISOString(),
      ...data
    });
    await warehouseRepository.save(tenantId, warehouse);

    if (eventBus) {
        await eventBus.publish('inventory.warehouse_created', {
            id: warehouse.id,
            name: warehouse.name,
            tenantId
        });
    }

    return warehouse;
  };
  return { execute };
};
