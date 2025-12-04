export const createKVUserRepository = (kvPool) => {
  const save = async (user) => {
    return kvPool.withConnection(async (kv) => {
      // Index by ID and Email
      const op = kv.atomic();
      op.set(['users', user.id], user);
      op.set(['users_by_email', user.email], user.id);
      await op.commit();
      return user;
    });
  };

  const findById = async (id) => {
    return kvPool.withConnection(async (kv) => {
      const res = await kv.get(['users', id]);
      return res.value;
    });
  };

  const findByEmail = async (email) => {
    return kvPool.withConnection(async (kv) => {
      const idRes = await kv.get(['users_by_email', email]);
      if (!idRes.value) return null;
      const res = await kv.get(['users', idRes.value]);
      return res.value;
    });
  };

  return { save, findById, findByEmail };
};
