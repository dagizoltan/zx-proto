export const createKVUserRepository = (kvPool) => {
  const save = async (tenantId, user) => {
    return kvPool.withConnection(async (kv) => {
      // Index by ID and Email
      const op = kv.atomic();
      op.set(['tenants', tenantId, 'users', user.id], user);
      op.set(['tenants', tenantId, 'users_by_email', user.email], user.id);
      await op.commit();
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

  return { save, findById, findByEmail, findAll };
};
