import { createRepository, useSchema } from '../../../../../lib/trust/index.js';
import { RoleSchema } from '../../../../ctx/access-control/domain/schemas/auth.schema.js';

export const createKVRoleRepository = (kvPool) => {
  return createRepository(kvPool, 'roles', [
    useSchema(RoleSchema)
  ]);
};
