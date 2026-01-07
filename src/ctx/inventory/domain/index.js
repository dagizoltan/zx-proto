
// EVENTS
export const StockReceived = 'StockReceived';
export const StockReserved = 'StockReserved'; // Internal reservation for an order
export const StockReleased = 'StockReleased';
export const StockShipped = 'StockShipped'; // Final consumption
export const StockAllocationFailed = 'StockAllocationFailed';

// COMMANDS
export const ReceiveStock = 'ReceiveStock';
export const ReserveStock = 'ReserveStock'; // External command from Orders
export const ReleaseStock = 'ReleaseStock';
export const ShipStock = 'ShipStock';

// HANDLERS
export const createInventoryHandlers = () => {
    return {
        [ReceiveStock]: async (loadStream, commitEvents, command) => {
            const { locationId, quantity, batchId, reason } = command.payload;
            const history = await loadStream();
            const currentVersion = history.length > 0 ? history[history.length - 1].version : 0;

            // Logic: Just add stock.
            // Validation: quantity > 0
            if (quantity <= 0) throw new Error("Quantity must be positive");

            const event = {
                type: StockReceived,
                data: {
                    productId: command.aggregateId, // Stream IS the Product ID
                    locationId,
                    batchId: batchId || 'default',
                    quantity,
                    reason,
                    timestamp: Date.now()
                }
            };

            await commitEvents([event], currentVersion);
        },

        [ReserveStock]: async (loadStream, commitEvents, command) => {
            const { orderId, quantity, allowPartial } = command.payload;
            const history = await loadStream();
            const currentVersion = history.length > 0 ? history[history.length - 1].version : 0;
            const state = hydrate(history);

            // Allocation Logic: FIFO or explicit batch?
            // "Pure" system: The aggregate (ProductStock) decides which batches to lock.
            // We use the hydration to see available stock per batch.

            let remaining = quantity;
            const allocations = [];

            // Sort batches: e.g. oldest first (FIFO) or default logic
            // State.batches is a Map or Object: { 'loc-batch': { qty, reserved } }
            // Let's assume we iterate batches.

            const availableBatches = Object.values(state.batches)
                .filter(b => (b.quantity - b.reserved) > 0)
                .sort((a, b) => a.receivedAt - b.receivedAt); // FIFO if we track time

            for (const batch of availableBatches) {
                if (remaining <= 0) break;
                const available = batch.quantity - batch.reserved;
                const take = Math.min(available, remaining);

                allocations.push({
                    locationId: batch.locationId,
                    batchId: batch.batchId,
                    quantity: take
                });
                remaining -= take;
            }

            if (remaining > 0 && !allowPartial) {
                // Failure
                const failEvent = {
                    type: StockAllocationFailed,
                    data: {
                        productId: command.aggregateId,
                        orderId,
                        requested: quantity,
                        available: quantity - remaining,
                        reason: 'Insufficient Stock',
                        timestamp: Date.now()
                    }
                };
                // We commit the failure event so we have a record, and process manager can react
                await commitEvents([failEvent], currentVersion);
                return;
            }

            // Success
            const event = {
                type: StockReserved,
                data: {
                    productId: command.aggregateId,
                    orderId,
                    allocations, // Which batches were reserved
                    totalReserved: quantity - remaining,
                    timestamp: Date.now()
                }
            };

            await commitEvents([event], currentVersion);
        },

        [ReleaseStock]: async (loadStream, commitEvents, command) => {
             // Logic to release reservation
             const { orderId } = command.payload;
             const history = await loadStream();
             const currentVersion = history.length > 0 ? history[history.length - 1].version : 0;
             const state = hydrate(history);

             // Find reservations for this order
             // State must track active reservations?
             // Or we rely on the command telling us what to release?
             // Usually `ReleaseStock` comes from a failed saga, knowing the orderId.
             // We need to know WHAT was reserved.
             // State needs `reservations: { orderId: [{ batch... }] }`

             const reservation = state.reservations[orderId];
             if (!reservation) {
                 // Already released or never existed. Idempotent.
                 return;
             }

             const event = {
                 type: StockReleased,
                 data: {
                     productId: command.aggregateId,
                     orderId,
                     allocations: reservation.allocations,
                     timestamp: Date.now()
                 }
             };

             await commitEvents([event], currentVersion);
        },

        [ShipStock]: async (loadStream, commitEvents, command) => {
             const { orderId } = command.payload;
             const history = await loadStream();
             const currentVersion = history.length > 0 ? history[history.length - 1].version : 0;
             const state = hydrate(history);

             const reservation = state.reservations[orderId];
             if (!reservation) {
                 throw new Error(`No reservation found for order ${orderId}`);
             }

             const event = {
                 type: StockShipped,
                 data: {
                     productId: command.aggregateId,
                     orderId,
                     allocations: reservation.allocations,
                     timestamp: Date.now()
                 }
             };

             await commitEvents([event], currentVersion);
        }
    };
};

// HELPER: Hydrate
const hydrate = (events) => {
    // State: { batches: { 'key': { ... } }, reservations: { 'orderId': { ... } } }
    const state = {
        batches: {},
        reservations: {}
    };

    for (const event of events) {
        const { type, data } = event;
        const batchKey = (loc, batch) => `${loc}:${batch}`;

        switch (type) {
            case StockReceived: {
                const key = batchKey(data.locationId, data.batchId);
                if (!state.batches[key]) {
                    state.batches[key] = {
                        locationId: data.locationId,
                        batchId: data.batchId,
                        quantity: 0,
                        reserved: 0,
                        receivedAt: data.timestamp
                    };
                }
                state.batches[key].quantity += data.quantity;
                break;
            }
            case StockReserved: {
                // Add to reservations
                state.reservations[data.orderId] = {
                    allocations: data.allocations,
                    timestamp: data.timestamp
                };
                // Increase reserved count
                for (const alloc of data.allocations) {
                    const key = batchKey(alloc.locationId, alloc.batchId);
                    if (state.batches[key]) {
                        state.batches[key].reserved += alloc.quantity;
                    }
                }
                break;
            }
            case StockReleased: {
                delete state.reservations[data.orderId];
                for (const alloc of data.allocations) {
                    const key = batchKey(alloc.locationId, alloc.batchId);
                    if (state.batches[key]) {
                        state.batches[key].reserved -= alloc.quantity;
                    }
                }
                break;
            }
             case StockShipped: {
                delete state.reservations[data.orderId];
                for (const alloc of data.allocations) {
                    const key = batchKey(alloc.locationId, alloc.batchId);
                    if (state.batches[key]) {
                        state.batches[key].reserved -= alloc.quantity;
                        state.batches[key].quantity -= alloc.quantity;
                    }
                }
                break;
            }
            case StockAllocationFailed:
                // No state change
                break;
        }
    }
    return state;
};
