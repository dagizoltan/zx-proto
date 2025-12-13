import { createRepository, useSchema, useIndexing, Ok, Err, isErr } from '../../../../../lib/trust/index.js';
import { RoleSchema } from '../../../../ctx/access-control/infrastructure/persistence/schemas/role.schema.js';
import { roleMapper } from '../../../../ctx/access-control/infrastructure/persistence/mappers/role.mapper.js';

/**
 * KV Adapter for Role Repository Port
 * Implements: IRoleRepository
 */
export const createKVRoleRepositoryAdapter = (kvPool) => {
  const baseRepo = createRepository(kvPool, 'roles', [
    useSchema(RoleSchema)
  ]);

  return {
    save: async (tenantId, roleEntity) => {
      try {
        const persistenceModel = roleMapper.toPersistence(roleEntity);
        const result = await baseRepo.save(tenantId, persistenceModel);
        if (isErr(result)) return result;
        return Ok(roleMapper.toDomain(result.value));
      } catch (e) {
        return Err({ code: 'PERSISTENCE_ERROR', message: e.message });
      }
    },

    findById: async (tenantId, id) => {
      const result = await baseRepo.findById(tenantId, id);
      if (isErr(result)) return result;
      return Ok(roleMapper.toDomain(result.value));
    },

    findByIds: async (tenantId, ids) => {
      const result = await baseRepo.findByIds(tenantId, ids);
      if (isErr(result)) return result;
      return Ok(roleMapper.toDomainList(result.value));
    },

    list: async (tenantId, options) => {
      const result = await baseRepo.list(tenantId, options);
      if (isErr(result)) return result;
      return Ok({ ...result.value, items: roleMapper.toDomainList(result.value.items) });
    }
  };
};
