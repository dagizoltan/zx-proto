import { createWarehouse as createWarehouseEntity } from '../../domain/entities/warehouse.js';

export const createCreateWarehouse = ({ warehouseRepository }) => {
  const execute = async (tenantId, data) => {
    const warehouse = createWarehouseEntity({
      id: crypto.randomUUID(),
      tenantId,
      createdAt: new Date().toISOString(),
      ...data
    });
    await warehouseRepository.save(tenantId, warehouse);
    return warehouse;
  };
  return { execute };
};
