import { createShipment } from '../../domain/entities/shipment.js';

export const createCreateShipment = ({ shipmentRepository, orderRepository, inventoryService, eventBus }) => {
  const execute = async (tenantId, data) => {
    // 1. Validate Order
    const order = await orderRepository.findById(tenantId, data.orderId);
    if (!order) throw new Error('Order not found');

    // 2. Create Shipment Entity
    const shipment = createShipment({
      id: crypto.randomUUID(),
      tenantId,
      ...data,
      shippedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });

    // 3. Save Shipment
    await shipmentRepository.save(tenantId, shipment);

    // 4. Update Inventory (Commit Allocation)
    await inventoryService.confirmStockShipment.execute(tenantId, order.id, shipment.items);

    // 5. Update Order Status
    // Calculate total shipped quantities including this new shipment
    const allShipments = await shipmentRepository.findByOrderId(tenantId, order.id);
    // Note: allShipments might not include the one just saved if consistency is eventual,
    // but Deno KV strong consistency within same request usually holds or we just push current shipment to array.
    // To be safe, let's use the list we have + current if not returned.

    let totalShipped = {};
    for (const s of allShipments) {
        for (const item of s.items) {
            totalShipped[item.productId] = (totalShipped[item.productId] || 0) + item.quantity;
        }
    }
    // Ensure current shipment is counted (if not in list yet)
    if (!allShipments.find(s => s.id === shipment.id)) {
        for (const item of shipment.items) {
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

    // Only update if status changes or moving forward
    if (order.status !== newStatus && order.status !== 'DELIVERED' && order.status !== 'CANCELLED') {
        const updatedOrder = { ...order, status: newStatus, updatedAt: new Date().toISOString() };
        await orderRepository.save(tenantId, updatedOrder);
    }

    if (eventBus) {
        await eventBus.publish('shipment.created', { tenantId, shipment });
    }

    return shipment;
  };

  return { execute };
};
