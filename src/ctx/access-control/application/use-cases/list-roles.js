import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';
import { QUERY_LIMITS } from '../../../../../src/constants.js';

export const createListRoles = ({ roleRepository }) => {
  const execute = async (tenantId) => {
    const res = await roleRepository.list(tenantId, { limit: QUERY_LIMITS.INTERNAL });
    if (isErr(res)) return res;

    // Return just the items array for now as per likely previous contract
    return Ok(res.value.items);
  };
  return { execute };
};
