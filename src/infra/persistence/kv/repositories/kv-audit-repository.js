import { createBaseRepository } from './base-repository.js';
import { AuditLog } from '../../../../ctx/system/domain/audit-log.js';

export const createKVAuditRepository = (kvPool) => {
  const base = createBaseRepository(kvPool, 'audit_logs');

  return {
    ...base,

    save: async (tenantId, log) => {
      return kvPool.withConnection(async (kv) => {
        const key = ['tenants', tenantId, 'audit_logs', log.id];
        await kv.set(key, log);
        return log;
      });
    }
  };
};
