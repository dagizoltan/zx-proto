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

    // 3. Update Inventory (Commit Allocation)
    // We do this BEFORE saving the shipment to ensure stock is available and committed.
    // If commit fails, shipment is not created.
    try {
        await inventoryService.confirmStockShipment.execute(tenantId, order.id, shipment.items);
    } catch (e) {
        throw new Error(`Failed to create shipment: ${e.message}`);
    }

    // 4. Save Shipment
    await shipmentRepository.save(tenantId, shipment);

    // 5. Update Order Status
    const allShipments = await shipmentRepository.findByOrderId(tenantId, order.id);

    // Aggregate shipped quantities
    const totalShipped = {};
    // ensure current is counted
    const shipmentsToCheck = [...allShipments];
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
    }

    if (eventBus) {
        await eventBus.publish('shipment.created', { tenantId, shipment });
    }

    return shipment;
  };

  return { execute };
};
