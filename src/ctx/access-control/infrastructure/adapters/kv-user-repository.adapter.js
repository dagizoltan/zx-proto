import { createRepository, useSchema, useIndexing, Ok, Err, isErr } from '../../../../../lib/trust/index.js';
import { UserSchema } from '../../../../ctx/access-control/infrastructure/persistence/schemas/user.schema.js';
import { userMapper } from '../../../../ctx/access-control/infrastructure/persistence/mappers/user.mapper.js';

/**
 * KV Adapter for User Repository Port
 * Implements: IUserRepository
 */
export const createKVUserRepositoryAdapter = (kvPool) => {
  const baseRepo = createRepository(kvPool, 'users', [
    useSchema(UserSchema),
    useIndexing({
      'email': (user) => user.email,
      'roleIds': (user) => user.roleIds // Renamed from 'role'
    })
  ]);

  return {
    save: async (tenantId, userEntity) => {
      try {
        const persistenceModel = userMapper.toPersistence(userEntity);
        const result = await baseRepo.save(tenantId, persistenceModel);
        if (isErr(result)) return result;
        return Ok(userMapper.toDomain(result.value));
      } catch (e) {
        return Err({ code: 'PERSISTENCE_ERROR', message: e.message });
      }
    },

    findById: async (tenantId, id) => {
      const result = await baseRepo.findById(tenantId, id);
      if (isErr(result)) return result;
      return Ok(userMapper.toDomain(result.value));
    },

    findByIds: async (tenantId, ids) => {
      const result = await baseRepo.findByIds(tenantId, ids);
      if (isErr(result)) return result;
      return Ok(userMapper.toDomainList(result.value));
    },

    findByEmail: async (tenantId, email) => {
        // Use standard query
        const result = await baseRepo.query(tenantId, {
            filter: { email },
            limit: 1
        });
        if (isErr(result)) return result;

        const items = result.value.items;
        if (items.length === 0) return Ok(null);

        return Ok(userMapper.toDomain(items[0]));
    },

    list: async (tenantId, options) => {
      const result = await baseRepo.list(tenantId, options);
      if (isErr(result)) return result;
      return Ok({ ...result.value, items: userMapper.toDomainList(result.value.items) });
    },

    queryByIndex: async (tenantId, indexName, value, options) => {
        // Compatibility wrapper
        const filter = {};
        filter[indexName] = value;
        const result = await baseRepo.query(tenantId, { filter, ...options });
        if (isErr(result)) return result;
        return Ok({ ...result.value, items: userMapper.toDomainList(result.value.items) });
    },

    query: async (tenantId, options) => {
      const result = await baseRepo.query(tenantId, options);
      if (isErr(result)) return result;
      return Ok({ ...result.value, items: userMapper.toDomainList(result.value.items) });
    }
  };
};
