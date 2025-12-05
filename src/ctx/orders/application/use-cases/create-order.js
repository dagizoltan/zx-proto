import { createOrder } from '../../domain/entities/order.js';
import { createOrderSchema } from '../schema.js';

export const createCreateOrder = ({ orderRepository, obs, registry, eventBus }) => {
  const execute = async (tenantId, userId, items, createdAt) => {
    // Validate input
    createOrderSchema.parse({ items });

    // Access other domains through registry
    const inventory = registry.get('domain.inventory');

    // Check stock availability for all items
    for (const item of items) {
      const available = await inventory.useCases.checkAvailability.execute(
        tenantId,
        item.productId,
        item.quantity
      );

      if (!available) {
        throw new Error(`Insufficient stock for product ${item.productId}`);
      }
    }

    // Fetch prices to ensure valid total (security)
    let calculatedTotal = 0;
    const enrichedItems = [];

    for (const item of items) {
        const product = await inventory.useCases.getProduct.execute(tenantId, item.productId);
        if (!product) throw new Error(`Product ${item.productId} not found`);

        const itemTotal = product.price * item.quantity;
        calculatedTotal += itemTotal;
        enrichedItems.push({
            productId: item.productId,
            quantity: item.quantity,
            price: product.price,
            name: product.name
        });
    }

    // Create order
    const order = createOrder({
      id: crypto.randomUUID(),
      userId,
      items: enrichedItems,
      total: calculatedTotal,
      createdAt
    });

    await orderRepository.save(tenantId, order);

    // Reserve stock
    for (const item of enrichedItems) {
      await inventory.useCases.reserveStock.execute(
        tenantId,
        item.productId,
        item.quantity,
        order.id,
        createdAt
      );
    }

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
