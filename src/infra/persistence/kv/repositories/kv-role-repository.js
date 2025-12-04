// Mock implementation for roles to support RBAC
export const createKVRoleRepository = (kvPool) => {
  const save = async (tenantId, role) => {
    return kvPool.withConnection(async (kv) => {
      await kv.set(['tenants', tenantId, 'roles', role.id], role);
      return role;
    });
  };

  const findById = async (tenantId, id) => {
    return kvPool.withConnection(async (kv) => {
      const res = await kv.get(['tenants', tenantId, 'roles', id]);
      return res.value;
    });
  };

  const findAll = async (tenantId) => {
      return kvPool.withConnection(async (kv) => {
          const iter = kv.list({ prefix: ['tenants', tenantId, 'roles'] });
          const roles = [];
          for await (const res of iter) {
              roles.push(res.value);
          }
          return roles;
      });
  };

  return { save, findById, findAll };
};
