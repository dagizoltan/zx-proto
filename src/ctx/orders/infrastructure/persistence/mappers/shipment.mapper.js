import { ShipmentSchema } from '../schemas/shipment.schema.js';
import { createShipment } from '../../../domain/entities/shipment.js';

export const shipmentMapper = {
  toDomain: (dbModel) => {
    if (!dbModel) return null;
    return createShipment({
      id: dbModel.id,
      tenantId: dbModel.tenantId,
      orderId: dbModel.orderId,
      code: dbModel.code,
      carrier: dbModel.carrier,
      trackingNumber: dbModel.trackingNumber,
      items: dbModel.items,
      status: dbModel.status,
      shippedAt: dbModel.shippedAt,
      createdAt: dbModel.createdAt
    });
  },
  toPersistence: (domainEntity) => {
    return ShipmentSchema.parse({
      id: domainEntity.id,
      tenantId: domainEntity.tenantId,
      orderId: domainEntity.orderId,
      code: domainEntity.code,
      carrier: domainEntity.carrier,
      trackingNumber: domainEntity.trackingNumber,
      items: domainEntity.items,
      status: domainEntity.status,
      shippedAt: domainEntity.shippedAt,
      createdAt: domainEntity.createdAt || new Date().toISOString()
    });
  },
  toDomainList: (dbModels) => dbModels.map(shipmentMapper.toDomain).filter(Boolean),
  toPersistenceList: (domainEntities) => domainEntities.map(shipmentMapper.toPersistence)
};
