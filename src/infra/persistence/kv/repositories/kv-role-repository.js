// Mock implementation for roles to support RBAC
export const createKVRoleRepository = (kvPool) => {
  const save = async (role) => {
    return kvPool.withConnection(async (kv) => {
      await kv.set(['roles', role.id], role);
      return role;
    });
  };

  const findById = async (id) => {
    return kvPool.withConnection(async (kv) => {
      const res = await kv.get(['roles', id]);
      return res.value;
    });
  };

  return { save, findById };
};
