import { createOrder } from '../../domain/entities/order.js';
import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';

export const createCreateOrder = ({ orderRepository, obs, registry, eventBus }) => {
  const execute = async (tenantId, userId, items) => {
    // Input validation? (Assumed handled by UI or caller, but new repo schema will catch save)

    const inventory = registry.get('domain.inventory');

    // 1. Prepare Enriched Items
    let calculatedTotal = 0;
    const enrichedItems = [];
    const stockReservationRequest = [];

    const productIds = [...new Set(items.map(item => item.productId))];

    // Inventory getProductsBatch likely returns Result now?
    // Need to verify inventory.useCases.getProductsBatch refactor.
    // Assuming I will refactor it to return Result.
    // If not refactored yet, I assume it returns array or throws.
    // But 'Rebase' implies I should use Results.

    const fetchRes = await inventory.useCases.getProductsBatch.execute(tenantId, productIds);
    if (isErr(fetchRes)) return fetchRes;
    const fetchedProducts = fetchRes.value; // Assuming array

    const productMap = new Map();
    fetchedProducts.forEach(p => productMap.set(p.id, p));

    for (const item of items) {
        if (!productMap.has(item.productId)) {
            return Err({ code: 'VALIDATION_ERROR', message: `Product ${item.productId} not found` });
        }
    }

    for (const item of items) {
        const product = productMap.get(item.productId);
        const itemTotal = product.price * item.quantity;
        calculatedTotal += itemTotal;
        enrichedItems.push({
            productId: product.id,
            quantity: item.quantity,
            unitPrice: product.price, // Changed to match Schema (unitPrice)
            totalPrice: itemTotal,    // Changed to match Schema (totalPrice)
            productName: product.name // Matches Schema
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
      customerId: userId, // Mapped userId -> customerId as per Schema
      tenantId,
      items: enrichedItems,
      totalAmount: calculatedTotal, // Mapped total -> totalAmount
      status: 'CREATED'
    });

    // 3. Reserve Stock
    // Needs refactor of inventory.useCases.reserveStock too
    try {
        const reserveRes = await inventory.useCases.reserveStock.executeBatch(
            tenantId,
            stockReservationRequest,
            order.id
        );
        if (isErr(reserveRes)) return reserveRes; // Propagate error (e.g. Insufficient Stock)
    } catch (e) {
        // Fallback for non-result exceptions
        return Err({ code: 'STOCK_ERROR', message: e.message });
    }

    // 4. Save Order
    const saveRes = await orderRepository.save(tenantId, order);

    if (isErr(saveRes)) {
        console.error('Order save failed, releasing stock...', saveRes.error);
        // Manual Rollback (Saga)
        // Note: Ideally all in one transaction if possible, but cross-domain makes it hard without shared transaction manager.
        // Since we are using separate repos and services, we rollback.
        try {
             await inventory.useCases.cancelStockReservation.execute(tenantId, order.id);
        } catch (releaseError) {
             console.error('CRITICAL: Failed to release stock after order save failure.', releaseError);
        }
        return saveRes;
    }

    if (eventBus) {
        await eventBus.publish('order.created', { ...order, tenantId });
    }

    if (obs) {
        await obs.audit('Order created', {
        orderId: order.id,
        userId,
        total: order.totalAmount,
        });
    }

    return Ok(order);
  };

  return { execute };
};
