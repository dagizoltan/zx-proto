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

  return { save, findById, findByEmail };
};
