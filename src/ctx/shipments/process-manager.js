
import { CreateShipment } from './domain/index.js';

export const createShipmentProcessManager = (commandBus, orderReadRepository) => {

    const handle = async (event) => {
        if (event.type === 'OrderConfirmed') {
            await handleOrderConfirmed(event);
        }
    };

    const handleOrderConfirmed = async (event) => {
        const { tenantId, data } = event;
        const { orderId } = data;

        // Fetch Order Details from View
        const order = await orderReadRepository.findById(tenantId, orderId);

        if (!order) {
            console.error(`[ShipmentProcessManager] Order ${orderId} confirmed but not found in view.`);
            return;
        }

        const shipmentId = crypto.randomUUID();

        console.log(`[ShipmentProcessManager] Creating shipment for Order ${orderId}`);

        await commandBus.execute({
            type: CreateShipment,
            aggregateId: shipmentId,
            tenantId,
            payload: {
                orderId,
                items: order.items,
                address: order.shippingAddress || { street: 'Unknown' } // Mock address if missing
            }
        });
    };

    return { handle };
};
