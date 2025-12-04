export const createUpdateOrderStatus = ({ orderRepository, registry, obs, eventBus }) => {
  const execute = async (tenantId, orderId, newStatus) => {
    const order = await orderRepository.findById(tenantId, orderId);
    if (!order) throw new Error('Order not found');

    const inventory = registry.get('domain.inventory');

    const oldStatus = order.status;

    // State Machine Validation & Actions
    if (newStatus === 'SHIPPED') {
        if (oldStatus !== 'PAID' && oldStatus !== 'CREATED') { // Allowing CREATED -> SHIPPED for simplicity if skipping payment
            throw new Error(`Cannot ship order in ${oldStatus} status`);
        }
        await inventory.useCases.confirmStockShipment.execute(tenantId, orderId);
    } else if (newStatus === 'CANCELLED') {
        if (oldStatus === 'SHIPPED' || oldStatus === 'DELIVERED') {
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
