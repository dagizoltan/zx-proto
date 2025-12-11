import { Ok } from '../../../../../lib/trust/index.js';

export const createListRoles = ({ roleRepository }) => {
  const execute = async (tenantId) => {
    // Repo returns items array (from findAll wrapper)
    // Wait, I updated kv-role-repository to expose repo.list directly?
    // No, I updated kv-role-repository.js to be:
    // createKVRoleRepository = (kvPool) => createRepository(...)
    // So 'findAll' DOES NOT EXIST on the new repo object. It has 'list'.
    // I need to update this use case to call 'list'.

    const res = await roleRepository.list(tenantId, { limit: 1000 });
    if (!res.ok) return res;

    // Legacy support: Use cases often expected array. Now they get { items, nextCursor } inside Ok.
    // The previous implementation returned array directly.
    // I should return Ok(items) to be clean, or Ok({ items }).
    // Let's stick to the Trust Platform pattern: Ok({ items, nextCursor }).

    return Ok(res.value.items);
  };
  return { execute };
};
