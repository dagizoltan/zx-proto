import { createOrder } from '../../domain/entities/order.js';
import { createOrderSchema } from '../schema.js';

export const createCreateOrder = ({ orderRepository, obs, registry, eventBus }) => {
  const execute = async (tenantId, userId, items) => {
    // Validate input
    createOrderSchema.parse({ items });

    // Access other domains through registry
    const inventory = registry.get('domain.inventory');

    // Optimization: Bulk Fetch Products (Not fully implemented in catalog yet, but we can parallelize)
    // We still need prices to calculate total.

    // 1. Prepare Enriched Items (Price Lookup)
    let calculatedTotal = 0;
    const enrichedItems = [];
    const stockReservationRequest = [];

    // Use Promise.all for fetching products (reduce N+1 latency)
    const products = await Promise.all(items.map(async item => {
        const p = await inventory.useCases.getProduct.execute(tenantId, item.productId);
        if (!p) throw new Error(`Product ${item.productId} not found`);
        return { ...p, requestedQty: item.quantity };
    }));

    for (const product of products) {
        const itemTotal = product.price * product.requestedQty;
        calculatedTotal += itemTotal;
        enrichedItems.push({
            productId: product.id,
            quantity: product.requestedQty,
            price: product.price,
            name: product.name
        });
        stockReservationRequest.push({
            productId: product.id,
            quantity: product.requestedQty
        });
    }

    // 2. Create Order (Pending Stock Confirmation)
    // We create the ID here to pass to reservation
    const orderId = crypto.randomUUID();
    const order = createOrder({
      id: orderId,
      userId,
      items: enrichedItems,
      total: calculatedTotal,
    });

    // 3. Batch Reserve Stock (Atomic-ish Check + Reserve)
    // This replaces the separate checkAvailability loop + separate reserve loop.
    // The `allocateBatch` method in inventory will do Check + Reserve in one go.

    try {
        await inventory.useCases.reserveStock.executeBatch(
            tenantId,
            stockReservationRequest,
            order.id
        );
    } catch (e) {
        // Map inventory error to user friendly error
        throw new Error(`Order creation failed: ${e.message}`);
    }

    // 4. Save Order
    // Only save if stock reservation succeeded
    await orderRepository.save(tenantId, order);

    // Publish event
    if (eventBus) {
        await eventBus.publish('order.created', { ...order, tenantId });
    }

    if (obs) {
        await obs.audit('Order created', {
        orderId: order.id,
        userId,
        total: order.total,
        });
    }

    return order;
  };

  return { execute };
};
