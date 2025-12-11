import { createRepository, useSchema, useIndexing } from '../../../../../lib/trust/index.js';
import { UserSchema } from '../../../../ctx/access-control/domain/schemas/auth.schema.js';

export const createKVUserRepository = (kvPool) => {
  return createRepository(kvPool, 'users', [
    useSchema(UserSchema),
    useIndexing({
      'email': (user) => user.email,
      'role': (user) => user.roleIds
    })
  ]);
};
