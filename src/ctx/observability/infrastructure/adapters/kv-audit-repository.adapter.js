import { createRepository, useSchema, useIndexing, Ok, Err, isErr } from '../../../../../lib/trust/index.js';
import { AuditLogSchema } from '../persistence/schemas/audit-log.schema.js';
import { auditLogMapper } from '../persistence/mappers/audit-log.mapper.js';

export const createKVAuditRepository = (kvPool) => {
    const baseRepo = createRepository(kvPool, 'audit_logs', [
        useSchema(AuditLogSchema),
        useIndexing({
            'user': (l) => l.userId,
            'resource': (l) => l.resource,
            'timestamp_desc': (l) => l.timestamp
        })
    ]);

    return {
        save: async (tenantId, domainEntity) => {
            try {
                const persistenceModel = auditLogMapper.toPersistence(domainEntity);
                const result = await baseRepo.save(tenantId, persistenceModel);
                if (isErr(result)) return result;
                return Ok(auditLogMapper.toDomain(result.value));
            } catch (e) {
                return Err({ code: 'VALIDATION_ERROR', message: e.message, issues: e.issues });
            }
        },
        findById: async (tenantId, id) => {
            const result = await baseRepo.findById(tenantId, id);
            if (isErr(result)) return result;
            return Ok(auditLogMapper.toDomain(result.value));
        },
        findByIds: async (tenantId, ids) => {
            const result = await baseRepo.findByIds(tenantId, ids);
            if (isErr(result)) return result;
            return Ok(auditLogMapper.toDomainList(result.value));
        },
        delete: (tenantId, id) => baseRepo.delete(tenantId, id),
        list: async (tenantId, options) => {
            const result = await baseRepo.list(tenantId, options);
            if (isErr(result)) return result;
            return Ok({ ...result.value, items: auditLogMapper.toDomainList(result.value.items) });
        },
        queryByIndex: async (tenantId, indexName, value, options) => {
            const result = await baseRepo.queryByIndex(tenantId, indexName, value, options);
            if (isErr(result)) return result;
            return Ok({ ...result.value, items: auditLogMapper.toDomainList(result.value.items) });
        },
        query: async (tenantId, options, context) => {
            const result = await baseRepo.query(tenantId, options, context);
            if (isErr(result)) return result;
            return Ok({ ...result.value, items: auditLogMapper.toDomainList(result.value.items) });
        }
    };
};
