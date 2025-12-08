export const createUpdateOrderStatus = ({ orderRepository, registry, obs, eventBus }) => {
  const execute = async (tenantId, orderId, newStatus) => {
    const order = await orderRepository.findById(tenantId, orderId);
    if (!order) throw new Error('Order not found');

    const inventory = registry.get('domain.inventory');

    const oldStatus = order.status;

    // Strict State Machine
    const VALID_TRANSITIONS = {
      'CREATED': ['PAID', 'CANCELLED'],
      'PAID': ['SHIPPED', 'PARTIALLY_SHIPPED', 'CANCELLED'],
      'PARTIALLY_SHIPPED': ['SHIPPED', 'CANCELLED', 'DELIVERED'], // Added DELIVERED just in case
      'SHIPPED': ['DELIVERED'],
      'DELIVERED': [], // Terminal
      'CANCELLED': []  // Terminal
    };

    const allowed = VALID_TRANSITIONS[oldStatus] || [];
    if (!allowed.includes(newStatus)) {
        // Allow idempotent updates (same status)
        if (oldStatus !== newStatus) {
            throw new Error(
                `Invalid status transition: ${oldStatus} -> ${newStatus}. ` +
                `Valid transitions: ${allowed.join(', ') || 'none'}`
            );
        }
    }

    // Actions based on transition
    if (newStatus === 'SHIPPED' && oldStatus !== 'SHIPPED') {
        // Ensure strictly correct logic. Previous code allowed CREATED -> SHIPPED. Now blocked.
        await inventory.useCases.confirmStockShipment.execute(tenantId, orderId);
    } else if (newStatus === 'CANCELLED' && oldStatus !== 'CANCELLED') {
        if (oldStatus === 'SHIPPED' || oldStatus === 'DELIVERED') {
             // Already blocked by State Machine, but double check logic
             throw new Error(`Cannot cancel order in ${oldStatus} status`);
        }
        await inventory.useCases.cancelStockReservation.execute(tenantId, orderId);
    }

    // Update Order
    const updatedOrder = {
        ...order,
        status: newStatus,
        updatedAt: new Date().toISOString()
    };

    await orderRepository.save(tenantId, updatedOrder);

    if (eventBus) {
        await eventBus.publish('order.status_updated', {
            orderId,
            oldStatus,
            newStatus,
            tenantId
        });
    }

    if (obs) {
        await obs.info(`Order ${orderId} updated to ${newStatus}`);
    }

    return updatedOrder;
  };

  return { execute };
};
