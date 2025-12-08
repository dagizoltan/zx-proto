import { createOrder } from '../../domain/entities/order.js';
import { createOrderSchema } from '../schema.js';

export const createCreateOrder = ({ orderRepository, obs, registry, eventBus }) => {
  const execute = async (tenantId, userId, items) => {
    // Validate input
    createOrderSchema.parse({ items });

    // Access other domains through registry
    const inventory = registry.get('domain.inventory');

    // 1. Prepare Enriched Items (Price Lookup)
    let calculatedTotal = 0;
    const enrichedItems = [];
    const stockReservationRequest = [];

    // FIX: N+1 Query in Order Creation
    // Use batch fetch instead of mapping through Promise.all with individual gets.
    // Map requests to unique product IDs
    const productIds = [...new Set(items.map(item => item.productId))];
    const fetchedProducts = await inventory.useCases.getProductsBatch.execute(tenantId, productIds);

    // Create lookup map
    const productMap = new Map();
    fetchedProducts.forEach(p => productMap.set(p.id, p));

    // Validate all products exist
    for (const item of items) {
        if (!productMap.has(item.productId)) {
            throw new Error(`Product ${item.productId} not found`);
        }
    }

    for (const item of items) {
        const product = productMap.get(item.productId);
        const itemTotal = product.price * item.quantity;
        calculatedTotal += itemTotal;
        enrichedItems.push({
            productId: product.id,
            quantity: item.quantity,
            price: product.price,
            name: product.name
        });
        stockReservationRequest.push({
            productId: product.id,
            quantity: item.quantity
        });
    }

    // 2. Create Order Object
    const orderId = crypto.randomUUID();
    const order = createOrder({
      id: orderId,
      userId,
      items: enrichedItems,
      total: calculatedTotal,
      status: 'CREATED' // Initial Status
    });

    // 3. Reserve Stock (Atomic Batch)
    try {
        await inventory.useCases.reserveStock.executeBatch(
            tenantId,
            stockReservationRequest,
            order.id
        );
    } catch (e) {
        throw new Error(`Order creation failed due to stock availability: ${e.message}`);
    }

    // 4. Save Order
    try {
        await orderRepository.save(tenantId, order);
    } catch (e) {
        console.error('Order save failed, releasing stock...', e);
        try {
             await inventory.useCases.cancelStockReservation.execute(tenantId, order.id);
        } catch (releaseError) {
             console.error('CRITICAL: Failed to release stock after order save failure. Orphaned stock.', releaseError);
        }
        throw new Error('Order creation failed during save. Please try again.');
    }

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
