import { SupplierSchema } from '../schemas/supplier.schema.js';
import { createSupplier } from '../../../domain/entities/supplier.js';
export const supplierMapper = {
  toDomain: (dbModel) => {
    if (!dbModel) return null;
    return createSupplier({
        ...dbModel,
        email: dbModel.contactEmail,
        code: dbModel.code || 'UNKNOWN'
    });
  },
  toPersistence: (domainEntity) => SupplierSchema.parse({
        id: domainEntity.id,
        name: domainEntity.name,
        contactEmail: domainEntity.email,
        phone: domainEntity.phone,
        address: domainEntity.address,
        status: domainEntity.status,
        createdAt: domainEntity.createdAt
  }),
  toDomainList: (dbModels) => dbModels.map(supplierMapper.toDomain).filter(Boolean),
  toPersistenceList: (domainEntities) => domainEntities.map(supplierMapper.toPersistence)
};
