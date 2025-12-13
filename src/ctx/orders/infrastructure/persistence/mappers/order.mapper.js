import { OrderSchema } from '../schemas/order.schema.js';
import { createOrder } from '../../../domain/entities/order.js';

export const orderMapper = {
  toDomain: (dbModel) => {
    if (!dbModel) return null;
    return createOrder({
      id: dbModel.id,
      tenantId: dbModel.tenantId,
      customerId: dbModel.customerId,
      items: dbModel.items,
      totalAmount: dbModel.totalAmount,
      status: dbModel.status,
      paymentStatus: dbModel.paymentStatus,
      shippingAddress: dbModel.shippingAddress,
      billingAddress: dbModel.billingAddress,
      createdAt: dbModel.createdAt,
      updatedAt: dbModel.updatedAt
    });
  },
  toPersistence: (domainEntity) => {
    return OrderSchema.parse({
      id: domainEntity.id,
      tenantId: domainEntity.tenantId,
      customerId: domainEntity.customerId,
      items: domainEntity.items,
      totalAmount: domainEntity.totalAmount,
      status: domainEntity.status,
      paymentStatus: domainEntity.paymentStatus,
      shippingAddress: domainEntity.shippingAddress,
      billingAddress: domainEntity.billingAddress,
      createdAt: domainEntity.createdAt || new Date().toISOString(),
      updatedAt: domainEntity.updatedAt || new Date().toISOString()
    });
  },
  toDomainList: (dbModels) => dbModels.map(orderMapper.toDomain).filter(Boolean),
  toPersistenceList: (domainEntities) => domainEntities.map(orderMapper.toPersistence)
};
