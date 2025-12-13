import { createBOM } from '../../../domain/entities/bom.js';

export const bomMapper = {
  toPersistence: (domainEntity) => {
    return {
      id: domainEntity.id,
      productId: domainEntity.productId,
      name: domainEntity.name,
      version: domainEntity.version,
      components: domainEntity.components,
      laborCost: domainEntity.laborCost,
      instructions: domainEntity.instructions,
      status: domainEntity.status,
      createdAt: domainEntity.createdAt,
      updatedAt: domainEntity.updatedAt
    };
  },
  toDomain: (persistenceEntity) => {
    if (!persistenceEntity) return null;
    return createBOM({
      id: persistenceEntity.id,
      productId: persistenceEntity.productId,
      name: persistenceEntity.name,
      version: persistenceEntity.version,
      components: persistenceEntity.components,
      laborCost: persistenceEntity.laborCost,
      instructions: persistenceEntity.instructions,
      status: persistenceEntity.status,
      createdAt: persistenceEntity.createdAt,
      updatedAt: persistenceEntity.updatedAt
    });
  },
  toDomainList: (persistenceList) => {
    return persistenceList.map(item => bomMapper.toDomain(item)).filter(item => item !== null);
  }
};
