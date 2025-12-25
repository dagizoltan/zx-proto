
import { OrderInitialized, ConfirmOrder, RejectOrder } from './domain.js';

// Constants for Inventory Commands/Events
const ReserveStock = 'ReserveStock';
const StockReserved = 'StockReserved';
const StockAllocationFailed = 'StockAllocationFailed';

export const createOrderProcessManager = (commandBus, inventoryCommandBus, kvPool) => {

    // Idempotency: Check if we already processed this event for this saga step.
    const isProcessed = async (eventId, step) => {
        if (!kvPool) return false; // MVP fallback if no pool provided
        const key = ['saga', 'order', eventId, step];
        const res = await kvPool.withConnection(kv => kv.get(key));
        return !!res.value;
    };

    const markProcessed = async (eventId, step) => {
        if (!kvPool) return;
        const key = ['saga', 'order', eventId, step];
        await kvPool.withConnection(kv => kv.set(key, true, { expireIn: 1000 * 60 * 60 * 24 }));
    };

    const handle = async (event) => {
        const { type, id: eventId } = event;

        // Step check depends on type
        const step = type;

        if (await isProcessed(eventId, step)) {
            console.log(`[ProcessManager] Skipping duplicate event ${eventId} (${type})`);
            return;
        }

        if (type === OrderInitialized) {
            await handleOrderInitialized(event);
        } else if (type === StockReserved) {
            await handleStockReserved(event);
        } else if (type === StockAllocationFailed) {
            await handleStockAllocationFailed(event);
        }

        await markProcessed(eventId, step);
    };

    // 1. Order Started -> Command Inventory
    const handleOrderInitialized = async (event) => {
        const { tenantId, data } = event;
        const { orderId, items } = data;

        console.log(`[ProcessManager] OrderInitialized ${orderId}. Requesting Stock.`);

        const item = items[0];
        if (!item) return;

        await inventoryCommandBus.execute({
            type: ReserveStock,
            aggregateId: item.id || item.productId,
            tenantId,
            payload: {
                orderId,
                quantity: item.qty || item.quantity,
                allowPartial: false
            }
        });
    };

    // 2. Stock Reserved -> Confirm Order
    const handleStockReserved = async (event) => {
        const { tenantId, data } = event;
        const { orderId } = data;

        console.log(`[ProcessManager] StockReserved for ${orderId}. Confirming Order.`);

        await commandBus.execute({
            type: ConfirmOrder,
            aggregateId: orderId,
            tenantId,
            payload: {}
        });
    };

    // 3. Stock Failed -> Reject Order
    const handleStockAllocationFailed = async (event) => {
        const { tenantId, data } = event;
        const { orderId, reason } = data;

        console.log(`[ProcessManager] StockAllocationFailed for ${orderId}. Rejecting Order.`);

        await commandBus.execute({
            type: RejectOrder,
            aggregateId: orderId,
            tenantId,
            payload: { reason }
        });
    };

    return {
        handle
    };
};
