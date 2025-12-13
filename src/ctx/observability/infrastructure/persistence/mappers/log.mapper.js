import { createLog } from '../../../domain/entities/log.js';

export const logMapper = {
  toPersistence: (domainEntity) => {
    return {
      id: domainEntity.id,
      tenantId: domainEntity.tenantId,
      service: domainEntity.service,
      level: domainEntity.level,
      message: domainEntity.message,
      meta: domainEntity.meta,
      timestamp: domainEntity.timestamp
    };
  },
  toDomain: (persistenceEntity) => {
    return createLog({
      id: persistenceEntity.id,
      tenantId: persistenceEntity.tenantId,
      service: persistenceEntity.service,
      level: persistenceEntity.level,
      message: persistenceEntity.message,
      meta: persistenceEntity.meta,
      timestamp: persistenceEntity.timestamp
    });
  },
  toDomainList: (persistenceEntities) => {
    return persistenceEntities.map(e => logMapper.toDomain(e));
  }
};
