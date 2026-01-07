
// EVENTS
export const ShipmentCreated = 'ShipmentCreated';
export const ShipmentShipped = 'ShipmentShipped';
export const ShipmentDelivered = 'ShipmentDelivered';

// COMMANDS
export const CreateShipment = 'CreateShipment';
export const ShipPackage = 'ShipPackage';
export const DeliverPackage = 'DeliverPackage';

// HANDLERS
export const createShipmentHandlers = () => {
    return {
        [CreateShipment]: async (loadStream, commitEvents, command) => {
            const { orderId, items, address } = command.payload;
            // Idempotency: aggregateId is usually `shipment-orderId` or a new UUID.
            // If we use orderId as part of key, we enforce 1 shipment per order (simplification).

            const history = await loadStream();
            if (history.length > 0) return; // Already created

            const event = {
                type: ShipmentCreated,
                data: {
                    shipmentId: command.aggregateId,
                    tenantId: command.tenantId,
                    orderId,
                    items,
                    address,
                    status: 'PREPARING',
                    createdAt: Date.now()
                }
            };
            await commitEvents([event], 0);
        },
        [ShipPackage]: async (loadStream, commitEvents, command) => {
            const { trackingNumber, carrier } = command.payload;
            const history = await loadStream();
            const state = hydrate(history);

            if (state.status !== 'PREPARING') {
                throw new Error(`Cannot ship shipment in status ${state.status}`);
            }

            const event = {
                type: ShipmentShipped,
                data: {
                    shipmentId: command.aggregateId,
                    trackingNumber,
                    carrier,
                    shippedAt: Date.now()
                }
            };
            // Append
            const version = history[history.length-1].version;
            await commitEvents([event], version);
        }
    };
};

// HYDRATE
const hydrate = (events) => {
    const state = { status: null };
    for (const e of events) {
        if (e.type === ShipmentCreated) state.status = 'PREPARING';
        if (e.type === ShipmentShipped) state.status = 'SHIPPED';
    }
    return state;
};
