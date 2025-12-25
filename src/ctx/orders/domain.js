
// EVENTS
export const OrderInitialized = 'OrderInitialized';
export const OrderConfirmed = 'OrderConfirmed';
export const OrderRejected = 'OrderRejected';

// COMMANDS
export const InitializeOrder = 'InitializeOrder';
export const ConfirmOrder = 'ConfirmOrder';
export const RejectOrder = 'RejectOrder';

// HANDLERS
export const createOrderHandlers = () => {
    return {
        [InitializeOrder]: async (loadStream, commitEvents, command) => {
            const { tenantId, items, customerId } = command.payload;

            // 1. Validation (stateless for initialization, usually)
            if (!items || items.length === 0) {
                throw new Error("Order must have items");
            }

            // 2. Event
            const event = {
                type: OrderInitialized,
                data: {
                    orderId: command.aggregateId,
                    tenantId,
                    customerId,
                    items,
                    status: 'PENDING',
                    createdAt: Date.now()
                }
            };

            // 3. Commit (Expected version 0 since it's new)
            await commitEvents([event], 0);
        },
        [ConfirmOrder]: async (loadStream, commitEvents, command) => {
            const history = await loadStream();
            const currentVersion = history.length > 0 ? history[history.length - 1].version : 0;
            const state = hydrate(history);

            if (state.status !== 'PENDING') {
                // Idempotency check or logic error
                // If already confirmed, we might ignore or error.
                if (state.status === 'CONFIRMED') return [];
                throw new Error(`Cannot confirm order in status ${state.status}`);
            }

            const event = {
                type: OrderConfirmed,
                data: {
                    orderId: command.aggregateId,
                    confirmedAt: Date.now()
                }
            };

            await commitEvents([event], currentVersion);
        },
        [RejectOrder]: async (loadStream, commitEvents, command) => {
            const { reason } = command.payload;
            const history = await loadStream();
            const currentVersion = history.length > 0 ? history[history.length - 1].version : 0;
            const state = hydrate(history);

            if (state.status !== 'PENDING') {
                 if (state.status === 'REJECTED') return [];
                 // technically can't reject a confirmed order easily without compensation, but for now:
                 throw new Error(`Cannot reject order in status ${state.status}`);
            }

            const event = {
                type: OrderRejected,
                data: {
                    orderId: command.aggregateId,
                    reason,
                    rejectedAt: Date.now()
                }
            };

            await commitEvents([event], currentVersion);
        }
    };
};

// HELPER: Hydrate State from Events
const hydrate = (events) => {
    const state = { status: null };
    for (const event of events) {
        switch (event.type) {
            case OrderInitialized:
                state.status = 'PENDING';
                state.items = event.data.items;
                state.customerId = event.data.customerId;
                break;
            case OrderConfirmed:
                state.status = 'CONFIRMED';
                break;
            case OrderRejected:
                state.status = 'REJECTED';
                break;
        }
    }
    return state;
};
