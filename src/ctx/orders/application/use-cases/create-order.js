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
    // We do this BEFORE saving the order to DB to prevent "Order exists, but Stock failed" state (Overselling risk is handled by atomic allocation).
    // Risk: "Stock Reserved, but Order Save Fails" (Orphaned Reservation).
    // Mitigation: We use a compensating transaction (Release) in the catch block.

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
        // CRITICAL: Rollback Stock Reservation
        console.error('Order save failed, releasing stock...', e);
        try {
             // We can use the generic release logic which finds allocations by Order ID
             // Wait, the movements are saved. So release logic works.
             await inventory.useCases.cancelStockReservation.execute(tenantId, order.id);
        } catch (releaseError) {
             console.error('CRITICAL: Failed to release stock after order save failure. Orphaned stock.', releaseError);
             // In enterprise system, this logs to an alert queue for manual intervention.
        }
        throw new Error('Order creation failed during save. Please try again.');
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
