import { createBaseRepository } from './base-repository.js';

export const createKVOrderRepository = (kvPool) => {
  const baseRepo = createBaseRepository(kvPool, 'orders');

  const save = async (tenantId, order) => {
    return kvPool.withConnection(async (kv) => {
      const op = kv.atomic();
      // Primary Key
      op.set(['tenants', tenantId, 'orders', order.id], order);

      // Secondary Index: User
      op.set(['tenants', tenantId, 'orders_by_user', order.userId, order.id], order.id);

      // Secondary Index: Status (Fix #12)
      op.set(['tenants', tenantId, 'orders_by_status', order.status, order.id], order.id);

      await op.commit();
      return order;
    });
  };

  const findById = async (tenantId, id) => {
    return kvPool.withConnection(async (kv) => {
      const res = await kv.get(['tenants', tenantId, 'orders', id]);
      return res.value;
    });
  };

  const findByUserId = async (tenantId, userId) => {
    return kvPool.withConnection(async (kv) => {
      const iter = kv.list({ prefix: ['tenants', tenantId, 'orders_by_user', userId] });
      const keys = [];
      for await (const res of iter) {
          keys.push(['tenants', tenantId, 'orders', res.value]);
      }

      if (keys.length === 0) return [];

      const results = await kv.getMany(keys);
      return results.map(r => r.value);
    });
  };

  const findAll = baseRepo.findAll;

  return { save, findById, findByUserId, findAll };
};
