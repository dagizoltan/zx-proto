
import { OrderInitialized, ConfirmOrder, RejectOrder } from './domain.js';

// Constants for Inventory Commands/Events (Ideally imported from shared lib or Inventory module)
const ReserveStock = 'ReserveStock';
const StockReserved = 'StockReserved';
const StockAllocationFailed = 'StockAllocationFailed';

export const createOrderProcessManager = (commandBus, inventoryCommandBus) => {

    // State tracking?
    // In a stateless function handler, we can't easily track saga state across events without a store.
    // However, the events themselves carry the correlation ID (orderId).

    const handle = async (event) => {
        const { type } = event;

        if (type === OrderInitialized) {
            await handleOrderInitialized(event);
        } else if (type === StockReserved) {
            await handleStockReserved(event);
        } else if (type === StockAllocationFailed) {
            await handleStockAllocationFailed(event);
        }
    };

    // 1. Order Started -> Command Inventory
    const handleOrderInitialized = async (event) => {
        const { tenantId, data } = event;
        const { orderId, items } = data;

        console.log(`[ProcessManager] OrderInitialized ${orderId}. Requesting Stock.`);

        // We need to issue a ReserveStock command for each item OR a batch.
        // Our Inventory Domain currently supports `ReserveStock` per Product (Aggregate = ProductId).
        // This implies we need a Saga that manages multiple products?
        // OR we enhance Inventory to handle Batch Reservations?
        // Given complexity, let's assume 1 Item for MVP, or we iterate.
        // If we have multiple items, we'd need a multi-step saga or an "InventoryReservation" aggregate.

        // Simplication for MVP: Iterate and fire commands.
        // BUT, how do we know when ALL are reserved?
        // We'd need to store "PendingReservations" state.

        // For this Proof of Concept, let's assume single-item orders OR that we just fire one command per item
        // and if ANY fail, we reject the order (Distributed Transaction problem).

        // Better Approach for PoC: `InventoryContext` handles a list of items in a Batch Command?
        // But our Aggregate is `ProductStock`.
        // Let's stick to 1 item for simplicity of the PoC validation, or
        // implement a "Reservation" aggregate in Inventory that coordinates product locks.

        // Let's assume the Order only has 1 type of item for now to prove the flow.
        const item = items[0];
        if (!item) return;

        await inventoryCommandBus.execute({
            type: ReserveStock,
            aggregateId: item.id || item.productId, // ProductID is the aggregate
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
