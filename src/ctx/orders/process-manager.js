
import { OrderInitialized, ConfirmOrder, RejectOrder } from './domain.js';

export const createOrderProcessManager = (commandBus, inventoryGateway) => {

    // The Process Manager (Saga) listens to events and dispatches commands.
    const handle = async (event) => {
        if (event.type === OrderInitialized) {
            await handleOrderInitialized(event);
        }
    };

    const handleOrderInitialized = async (event) => {
        const { tenantId, data } = event;
        const { orderId, items } = data;

        console.log(`[ProcessManager] Processing OrderInitialized: ${orderId}`);

        try {
            // 1. Call Inventory (Async Check)
            // Note: In a pure event system, we would issue a `ReserveStock` command and wait for `StockReserved` event.
            // For this hybrid step (Phase 2), we call the Gateway, which might be sync or async HTTP.
            // But we treat the RESULT here as the trigger for the next command.

            // We use the compatibility layer or direct gateway.
            // Assumption: `inventoryGateway.reserveStock` returns true/false or throws.
            // Based on `src/ctx/inventory/index.js`, `reserveStock` exists.

            // The signature in `reserveStock` use case is `execute(tenantId, items, orderId)`.
            // We need to match that.

            const result = await inventoryGateway.reserveStock.execute(tenantId, items, orderId);

            if (result && result.success !== false) {
                 // 2. Success -> Confirm Order
                 console.log(`[ProcessManager] Stock confirmed for ${orderId}. Dispatching ConfirmOrder.`);
                 await commandBus.execute({
                     type: ConfirmOrder,
                     aggregateId: orderId,
                     tenantId,
                     payload: {}
                 });
            } else {
                 // Failure (Soft)
                 console.log(`[ProcessManager] Stock failed for ${orderId}. Dispatching RejectOrder.`);
                 await commandBus.execute({
                     type: RejectOrder,
                     aggregateId: orderId,
                     tenantId,
                     payload: { reason: 'Out of Stock' }
                 });
            }

        } catch (error) {
            console.error(`[ProcessManager] Error processing order ${orderId}:`, error);
            // 3. Failure (Hard) -> Reject Order
            await commandBus.execute({
                type: RejectOrder,
                aggregateId: orderId,
                tenantId,
                payload: { reason: error.message || 'Inventory Error' }
            });
        }
    };

    return {
        handle
    };
};
