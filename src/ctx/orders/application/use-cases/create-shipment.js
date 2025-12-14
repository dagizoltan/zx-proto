import { createShipment } from '../../domain/entities/shipment.js';
import { DomainError } from '../../domain/errors/domain-errors.js';
import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';

export const createCreateShipment = ({ shipmentRepository, orderRepository, inventoryGateway, eventBus }) => {
  const execute = async (tenantId, data) => {
    try {
        // 1. Validate Order
        const orderRes = await orderRepository.findById(tenantId, data.orderId);
        if (isErr(orderRes)) return Err({ code: 'VALIDATION_ERROR', message: 'Order not found' });
        const order = orderRes.value;
        if (!order) return Err({ code: 'VALIDATION_ERROR', message: 'Order not found' });

        // 2. Create Shipment Entity
        const shipmentId = crypto.randomUUID();
        const shipment = createShipment({
          id: shipmentId,
          tenantId,
          ...data,
          shippedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        });

        // 3. Update Inventory (Commit Allocation)
        const confirmRes = await inventoryGateway.confirmShipment(tenantId, order.id, shipment.items);
        if (isErr(confirmRes)) return confirmRes;

        // 4. Save Shipment
        const saveRes = await shipmentRepository.save(tenantId, shipment);
        if (isErr(saveRes)) return saveRes;

        // 5. Update Order Status
        const shipRes = await shipmentRepository.queryByIndex(tenantId, 'orderId', order.id);
        if (isErr(shipRes)) return shipRes;

        const allShipments = shipRes.value.items;
        // Check if current shipment is in list (read-your-writes check)
        if (!allShipments.find(s => s.id === shipment.id)) {
            allShipments.push(shipment);
        }

        const totalShipped = {};
        for (const s of allShipments) {
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
            const updateRes = await orderRepository.save(tenantId, updatedOrder);
            if (isErr(updateRes)) {
                 // Log warning: inconsistency
            }
        }

        if (eventBus) {
            await eventBus.publish('shipment.created', { tenantId, shipment });
        }

        return Ok(shipment);
    } catch (error) {
         if (error instanceof DomainError) {
            return Err({ code: error.code, message: error.message });
         }
         return Err({ code: 'CREATE_SHIPMENT_ERROR', message: error.message });
    }
  };

  return { execute };
};
