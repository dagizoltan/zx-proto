import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';

export const createListRoles = ({ roleRepository, config }) => {
  const limits = config ? config.get('query.limits') : { default: 20, max: 100, internal: 500 };

  const execute = async (tenantId) => {
    const res = await roleRepository.list(tenantId, { limit: limits.internal });
    if (isErr(res)) return res;

    // Return just the items array for now as per likely previous contract
    return Ok(res.value.items);
  };
  return { execute };
};
