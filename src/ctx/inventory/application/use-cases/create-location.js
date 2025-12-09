import { createLocation as createLocationEntity } from '../../domain/entities/warehouse.js';

export const createCreateLocation = ({ locationRepository, warehouseRepository, eventBus }) => {
  const execute = async (tenantId, data) => {
    // Validate warehouse exists
    const warehouse = await warehouseRepository.findById(tenantId, data.warehouseId);
    if (!warehouse) throw new Error('Warehouse not found');

    // Validate parent if provided
    if (data.parentId) {
      const parent = await locationRepository.findById(tenantId, data.parentId);
      if (!parent) throw new Error('Parent location not found');
    }

    const location = createLocationEntity({
      id: crypto.randomUUID(),
      tenantId,
      createdAt: new Date().toISOString(),
      ...data
    });

    await locationRepository.save(tenantId, location);

    if (eventBus) {
        await eventBus.publish('inventory.location_created', {
            id: location.id,
            name: location.name,
            warehouseId: location.warehouseId,
            tenantId
        });
    }

    return location;
  };
  return { execute };
};
