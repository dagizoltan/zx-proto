import { createBaseRepository } from './base-repository.js';
import { AuditLog } from '../../../../ctx/system/domain/audit-log.js';

export const createKVAuditRepository = (kv) => {
  const base = createBaseRepository(kv, 'audit_logs');

  return {
    ...base,

    save: async (tenantId, log) => {
      // Key: ['tenants', tenantId, 'audit_logs', id]
      // We might want secondary indexes for time-series access,
      // but base repo supports listing by order if keys are monotonic?
      // Audit logs are best time-sorted.
      // We can use a time-based key: [tenantId, 'audit', timestamp, id]
      // But let's stick to standard ID based for compatibility with base repo for now,
      // and rely on naive sort for "Last 50 events".

      const key = ['tenants', tenantId, 'audit_logs', log.id];
      await kv.set(key, log);
      return log;
    }
  };
};
