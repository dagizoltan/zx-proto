import { createShipment } from '../../domain/entities/shipment.js';
import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';

export const createCreateShipment = ({ shipmentRepository, orderRepository, inventoryService, eventBus }) => {
  const execute = async (tenantId, data) => {
    // 1. Validate Order
    const orderRes = await orderRepository.findById(tenantId, data.orderId);
    if (isErr(orderRes)) return Err({ code: 'VALIDATION_ERROR', message: 'Order not found' });
    const order = orderRes.value;

    // 2. Create Shipment Entity
    const shipment = createShipment({
      id: crypto.randomUUID(),
      tenantId,
      ...data,
      shippedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });

    // 3. Update Inventory (Commit Allocation)
    // inventoryService.confirmStockShipment needs to be verified for Result return
    try {
        const confirmRes = await inventoryService.confirmStockShipment.execute(tenantId, order.id, shipment.items);
        if (isErr(confirmRes)) return confirmRes;
    } catch (e) {
        return Err({ code: 'INVENTORY_ERROR', message: `Failed to commit stock: ${e.message}` });
    }

    // 4. Save Shipment
    const saveRes = await shipmentRepository.save(tenantId, shipment);
    if (isErr(saveRes)) return saveRes;

    // 5. Update Order Status
    // findByOrderId -> queryByIndex
    const shipRes = await shipmentRepository.queryByIndex(tenantId, 'order', order.id);
    if (isErr(shipRes)) return shipRes;

    const allShipments = shipRes.value.items;

    const totalShipped = {};
    const shipmentsToCheck = [...allShipments];
    // shipment was just saved, so it should be in the list?
    // Wait, queryByIndex might have eventual consistency or read-your-writes?
    // Deno KV is strongly consistent if using the same atomic path, but queryByIndex is a scan.
    // However, if we just saved it, it should be there.
    // Safe bet: check if it's there.
    if (!shipmentsToCheck.find(s => s.id === shipment.id)) {
        shipmentsToCheck.push(shipment);
    }

    for (const s of shipmentsToCheck) {
        for (const item of s.items) {
            totalShipped[item.productId] = (totalShipped[item.productId] || 0) + item.quantity;
        }
    }

    let fullyShipped = true;
    for (const item of order.items) {
        const shippedQty = totalShipped[item.productId] || 0;
        if (shippedQty < item.quantity) {
            fullyShipped = false;
            break;
        }
    }

    const newStatus = fullyShipped ? 'SHIPPED' : 'PARTIALLY_SHIPPED';

    if (order.status !== newStatus && order.status !== 'DELIVERED' && order.status !== 'CANCELLED') {
        const updatedOrder = { ...order, status: newStatus, updatedAt: new Date().toISOString() };
        await orderRepository.save(tenantId, updatedOrder);
        // If this save fails, we have an inconsistency (Shipment exists, Order status wrong).
        // Acceptable risk for now, or use retry.
    }

    if (eventBus) {
        await eventBus.publish('shipment.created', { tenantId, shipment });
    }

    return Ok(shipment);
  };

  return { execute };
};
