import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';

export const createUpdateOrderStatus = ({ orderRepository, registry, obs, eventBus }) => {
  const execute = async (tenantId, orderId, newStatus) => {
    const res = await orderRepository.findById(tenantId, orderId);
    if (isErr(res)) return Err({ code: 'NOT_FOUND', message: 'Order not found' });
    const order = res.value;

    const inventory = registry.get('domain.inventory');

    const oldStatus = order.status;

    // Strict State Machine
    const VALID_TRANSITIONS = {
      'CREATED': ['PAID', 'CANCELLED'],
      'PAID': ['SHIPPED', 'PARTIALLY_SHIPPED', 'CANCELLED'],
      'PARTIALLY_SHIPPED': ['SHIPPED', 'CANCELLED', 'DELIVERED'],
      'SHIPPED': ['DELIVERED'],
      'DELIVERED': [],
      'CANCELLED': []
    };

    const allowed = VALID_TRANSITIONS[oldStatus] || [];
    if (!allowed.includes(newStatus)) {
        if (oldStatus !== newStatus) {
            return Err({
                code: 'INVALID_TRANSITION',
                message: `Invalid status transition: ${oldStatus} -> ${newStatus}. Valid: ${allowed.join(', ') || 'none'}`
            });
        }
    }

    // Actions based on transition
    if (newStatus === 'SHIPPED' && oldStatus !== 'SHIPPED') {
        const confirmRes = await inventory.useCases.confirmStockShipment.execute(tenantId, orderId);
        if (isErr(confirmRes)) return confirmRes;
    } else if (newStatus === 'CANCELLED' && oldStatus !== 'CANCELLED') {
        if (oldStatus === 'SHIPPED' || oldStatus === 'DELIVERED') {
             return Err({ code: 'INVALID_TRANSITION', message: `Cannot cancel order in ${oldStatus} status` });
        }
        const cancelRes = await inventory.useCases.cancelStockReservation.execute(tenantId, orderId);
        if (isErr(cancelRes)) return cancelRes;
    }

    // Update Order
    const updatedOrder = {
        ...order,
        status: newStatus,
        updatedAt: new Date().toISOString()
    };

    const saveRes = await orderRepository.save(tenantId, updatedOrder);
    if (isErr(saveRes)) return saveRes;

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

    return Ok(updatedOrder);
  };

  return { execute };
};
