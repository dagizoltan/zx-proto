export const createKVShipmentRepository = (kvPool) => {
  const save = async (tenantId, shipment) => {
    return kvPool.withConnection(async (kv) => {
      // Save primary key
      await kv.set(['tenants', tenantId, 'shipments', shipment.id], shipment);

      // Index by Order ID for fast lookup
      await kv.set(['tenants', tenantId, 'shipments_by_order', shipment.orderId, shipment.id], shipment.id);

      return shipment;
    });
  };

  const findById = async (tenantId, id) => {
    return kvPool.withConnection(async (kv) => {
      const res = await kv.get(['tenants', tenantId, 'shipments', id]);
      return res.value;
    });
  };

  const findByOrderId = async (tenantId, orderId) => {
    return kvPool.withConnection(async (kv) => {
      const iter = kv.list({ prefix: ['tenants', tenantId, 'shipments_by_order', orderId] });
      const shipments = [];
      for await (const res of iter) {
        const shipmentId = res.value;
        const shipmentRes = await kv.get(['tenants', tenantId, 'shipments', shipmentId]);
        if (shipmentRes.value) {
            shipments.push(shipmentRes.value);
        }
      }
      return shipments;
    });
  };

  const findAll = async (tenantId, { limit = 10, cursor } = {}) => {
    return kvPool.withConnection(async (kv) => {
      const iter = kv.list({ prefix: ['tenants', tenantId, 'shipments'] }, { cursor });
      const items = [];
      let nextCursor = null;

      for await (const res of iter) {
        items.push(res.value);
        if (items.length >= limit) {
          nextCursor = iter.cursor;
          break;
        }
      }
      return { items, nextCursor };
    });
  };

  return { save, findById, findByOrderId, findAll };
};
