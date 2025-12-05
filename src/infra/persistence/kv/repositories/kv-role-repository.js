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

  // NEW: Batch Fetch to solve N+1
  const findByIds = async (tenantId, ids) => {
      if (!ids || ids.length === 0) return [];
      return kvPool.withConnection(async (kv) => {
          const keys = ids.map(id => ['tenants', tenantId, 'roles', id]);
          const results = await kv.getMany(keys);
          // Filter out nulls (missing roles)
          return results.map(r => r.value).filter(r => r !== null);
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

  return { save, findById, findByIds, findAll };
};
