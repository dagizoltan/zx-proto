import { AuditLogSchema } from '../schemas/audit-log.schema.js';
import { createAuditLog } from '../../../domain/entities/audit-log.js';
export const auditLogMapper = {
  toDomain: (dbModel) => { if (!dbModel) return null; return createAuditLog(dbModel); },
  toPersistence: (domainEntity) => AuditLogSchema.parse({
        id: domainEntity.id,
        tenantId: domainEntity.tenantId,
        userId: domainEntity.userId,
        action: domainEntity.action,
        resource: domainEntity.resource,
        resourceId: domainEntity.resourceId,
        details: domainEntity.details,
        ipAddress: domainEntity.ipAddress,
        timestamp: domainEntity.timestamp
  }),
  toDomainList: (dbModels) => dbModels.map(auditLogMapper.toDomain).filter(Boolean),
  toPersistenceList: (domainEntities) => domainEntities.map(auditLogMapper.toPersistence)
};
