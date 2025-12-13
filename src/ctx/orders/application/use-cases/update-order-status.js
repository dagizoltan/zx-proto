import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';

export const createUpdateOrderStatus = ({
  orderRepository,
  inventoryGateway,
  obs,
  eventBus
}) => {
  const execute = async (tenantId, orderId, newStatus) => {
    const res = await orderRepository.findById(tenantId, orderId);
    if (isErr(res)) return Err({ code: 'NOT_FOUND', message: 'Order not found' });

    const order = res.value;
    if (!order) return Err({ code: 'NOT_FOUND', message: 'Order not found' });

    const oldStatus = order.status;

    // State Machine Validation
    const VALID_TRANSITIONS = {
      'CREATED': ['PAID', 'CANCELLED'],
      'PAID': ['SHIPPED', 'PARTIALLY_SHIPPED', 'CANCELLED'],
      'PARTIALLY_SHIPPED': ['SHIPPED', 'CANCELLED', 'DELIVERED'],
      'SHIPPED': ['DELIVERED'],
      'DELIVERED': [],
      'CANCELLED': []
    };

    const allowed = VALID_TRANSITIONS[oldStatus] || [];
    if (!allowed.includes(newStatus) && oldStatus !== newStatus) {
      return Err({
        code: 'INVALID_TRANSITION',
        message: `Invalid status transition: ${oldStatus} → ${newStatus}`
      });
    }

    // Execute Side Effects
    if (newStatus === 'SHIPPED' && oldStatus !== 'SHIPPED') {
      const confirmRes = await inventoryGateway.confirmShipment(tenantId, orderId);
      if (isErr(confirmRes)) return confirmRes;
    } else if (newStatus === 'CANCELLED' && oldStatus !== 'CANCELLED') {
      if (oldStatus === 'SHIPPED' || oldStatus === 'DELIVERED') {
        return Err({
          code: 'INVALID_TRANSITION',
          message: `Cannot cancel order in ${oldStatus} status`
        });
      }
      const releaseRes = await inventoryGateway.releaseStock(tenantId, orderId);
      if (isErr(releaseRes)) return releaseRes;
    }

    // Update Order
    const updatedOrder = {
      ...order,
      status: newStatus,
      updatedAt: new Date().toISOString()
    };

    const saveRes = await orderRepository.save(tenantId, updatedOrder);
    if (isErr(saveRes)) return saveRes;

    // Publish Event
    if (eventBus) {
      await eventBus.publish('order.status_updated', {
        orderId,
        oldStatus,
        newStatus,
        tenantId
      });
    }

    // Audit Log
    if (obs) {
      await obs.info(`Order ${orderId} status updated to ${newStatus}`);
    }

    return Ok(updatedOrder);
  };

  return { execute };
};
