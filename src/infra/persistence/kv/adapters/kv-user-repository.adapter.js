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
      'role': (user) => user.roleIds
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

    findByEmail: async (tenantId, email) => {
        // Using existing queryByIndex which returns { items: [], ... }
        const result = await baseRepo.queryByIndex(tenantId, 'email', email);
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

    // Additional method needed for some use cases (findUsersByRole)
    queryByIndex: async (tenantId, indexName, value, options) => {
        const result = await baseRepo.queryByIndex(tenantId, indexName, value, options);
        if (isErr(result)) return result;
        return Ok({ ...result.value, items: userMapper.toDomainList(result.value.items) });
    }
  };
};
