export const createKVUserRepository = (kvPool) => {
  const save = async (tenantId, user) => {
    return kvPool.withConnection(async (kv) => {
      // Fetch existing for index cleanup
      const existingRes = await kv.get(['tenants', tenantId, 'users', user.id]);
      const existing = existingRes.value;

      const op = kv.atomic();

      // OCC Check
      if (existing) {
          op.check({ key: ['tenants', tenantId, 'users', user.id], versionstamp: existingRes.versionstamp });
      }

      op.set(['tenants', tenantId, 'users', user.id], user);
      op.set(['tenants', tenantId, 'users_by_email', user.email], user.id);

      // Index by Role Logic
      const newRoles = new Set(user.roleIds || []);
      const oldRoles = new Set(existing ? (existing.roleIds || []) : []);

      // Remove removed roles
      for (const roleId of oldRoles) {
          if (!newRoles.has(roleId)) {
              op.delete(['tenants', tenantId, 'users_by_role', roleId, user.id]);
          }
      }

      // Add new roles
      for (const roleId of newRoles) {
          op.set(['tenants', tenantId, 'users_by_role', roleId, user.id], user.id);
      }

      const commit = await op.commit();
      if (!commit.ok) {
           throw new Error('Concurrent modification detected (User)');
      }
      return user;
    });
  };

  const findById = async (tenantId, id) => {
    return kvPool.withConnection(async (kv) => {
      const res = await kv.get(['tenants', tenantId, 'users', id]);
      return res.value;
    });
  };

  const findByEmail = async (tenantId, email) => {
    return kvPool.withConnection(async (kv) => {
      const idRes = await kv.get(['tenants', tenantId, 'users_by_email', email]);
      if (!idRes.value) return null;
      const res = await kv.get(['tenants', tenantId, 'users', idRes.value]);
      return res.value;
    });
  };

  const findByRole = async (tenantId, roleId, { limit = 20, cursor } = {}) => {
      return kvPool.withConnection(async (kv) => {
          const iter = kv.list({ prefix: ['tenants', tenantId, 'users_by_role', roleId] }, { cursor });
          const userIds = [];
          let nextCursor = null;

          for await (const res of iter) {
              userIds.push(res.value);
              if (userIds.length >= limit) {
                  nextCursor = iter.cursor;
                  break;
              }
          }

          if (userIds.length === 0) return { items: [], nextCursor: null };

          // Batch fetch users
          const keys = userIds.map(id => ['tenants', tenantId, 'users', id]);
          const results = await kv.getMany(keys);
          const users = results.map(r => r.value).filter(u => u !== null).map(u => {
              const { passwordHash, ...safeUser } = u;
              return safeUser;
          });

          return { items: users, nextCursor };
      });
  };

  const findAll = async (tenantId, { limit = 20, cursor, search } = {}) => {
    return kvPool.withConnection(async (kv) => {
      const iter = kv.list({ prefix: ['tenants', tenantId, 'users'] }, { cursor });
      const users = [];
      let nextCursor = null;

      const searchTerm = search ? search.toLowerCase() : null;

      for await (const res of iter) {
        const user = res.value;
        let match = true;

        if (searchTerm) {
            const inName = user.name?.toLowerCase().includes(searchTerm);
            const inEmail = user.email?.toLowerCase().includes(searchTerm);
            if (!inName && !inEmail) match = false;
        }

        if (match) {
            // Remove password hash before returning list
            const { passwordHash, ...safeUser } = user;
            users.push(safeUser);
        }

        if (users.length >= limit) {
          nextCursor = iter.cursor;
          break;
        }
      }

      return { items: users, nextCursor };
    });
  };

  return { save, findById, findByEmail, findAll, findByRole };
};
