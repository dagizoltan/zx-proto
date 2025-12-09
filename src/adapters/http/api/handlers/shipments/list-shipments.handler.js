import { toApiShipment } from '../../transformers/shipments.transformer.js';

export const listShipmentsHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const orders = c.ctx.get('domain.orders');
    const query = c.get('validatedQuery');

    // Check use case signature: listShipments(tenantId, { limit, cursor, orderId })
    const result = await orders.useCases.listShipments.execute(tenantId, {
        limit: query.limit,
        cursor: query.cursor,
        orderId: query.orderId
    });

    const list = Array.isArray(result) ? result : (result.items || []);
    // If result has nextCursor, we should return it.
    // The transformer needs to handle the structure.

    // Let's assume standard list response { items, nextCursor }
    return c.json({
        items: list.map(toApiShipment),
        nextCursor: result.nextCursor
    });
};

export const createShipmentHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const orders = c.ctx.get('domain.orders');
    const data = c.get('validatedData');

    // If orderId is not in body, it might be in URL params if we nested routes.
    // But here we are creating a top-level shipments route.
    // We expect orderId in body.
    if (!data.orderId) {
        return c.json({ error: 'orderId is required' }, 400);
    }

    const shipment = await orders.useCases.createShipment.execute(tenantId, data.orderId, data);
    return c.json(toApiShipment(shipment), 201);
};
