import { createSupplier } from '../../../domain/entities/supplier.js';

export const supplierMapper = {
  toPersistence: (domainEntity) => {
    return {
      id: domainEntity.id,
      name: domainEntity.name,
      code: domainEntity.code,
      contactName: domainEntity.contactName,
      contactEmail: domainEntity.email, // Map email to contactEmail
      phone: domainEntity.phone,
      address: domainEntity.address,
      currency: domainEntity.currency,
      paymentTerms: domainEntity.paymentTerms,
      status: domainEntity.status,
      createdAt: domainEntity.createdAt,
      updatedAt: domainEntity.updatedAt
    };
  },
  toDomain: (persistenceEntity) => {
    if (!persistenceEntity) return null;
    return createSupplier({
      id: persistenceEntity.id,
      name: persistenceEntity.name,
      code: persistenceEntity.code,
      contactName: persistenceEntity.contactName,
      email: persistenceEntity.contactEmail, // Map back
      phone: persistenceEntity.phone,
      address: persistenceEntity.address,
      currency: persistenceEntity.currency,
      paymentTerms: persistenceEntity.paymentTerms,
      status: persistenceEntity.status,
      createdAt: persistenceEntity.createdAt,
      updatedAt: persistenceEntity.updatedAt
    });
  },
  toDomainList: (persistenceList) => {
    return persistenceList.map(item => supplierMapper.toDomain(item)).filter(item => item !== null);
  }
};
