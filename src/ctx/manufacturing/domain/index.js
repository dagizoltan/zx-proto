
// EVENTS
export const ProductionScheduled = 'ProductionScheduled';
export const ProductionStarted = 'ProductionStarted';
export const ProductionCompleted = 'ProductionCompleted';

// COMMANDS
export const ScheduleProduction = 'ScheduleProduction';
export const StartProduction = 'StartProduction';
export const CompleteProduction = 'CompleteProduction';

// HANDLERS
export const createManufacturingHandlers = () => {
    return {
        [ScheduleProduction]: async (loadStream, commitEvents, command) => {
            const { tenantId, productionOrderId, productId, quantity, rawMaterials, dueDate } = command.payload;
            const history = await loadStream();
            if (history.length > 0) return;

            const event = {
                type: ProductionScheduled,
                data: {
                    productionOrderId: command.aggregateId,
                    tenantId,
                    productId,
                    quantity,
                    rawMaterials, // Array of { productId, quantity }
                    dueDate,
                    status: 'SCHEDULED',
                    createdAt: Date.now()
                }
            };
            await commitEvents([event], 0);
        },
        [StartProduction]: async (loadStream, commitEvents, command) => {
            const history = await loadStream();
            const currentVersion = history.length > 0 ? history[history.length-1].version : 0;
            const event = {
                type: ProductionStarted,
                data: {
                    productionOrderId: command.aggregateId,
                    startedAt: Date.now()
                }
            };
            await commitEvents([event], currentVersion);
        },
        [CompleteProduction]: async (loadStream, commitEvents, command) => {
            const { actualQuantity } = command.payload;

            const history = await loadStream();
            const currentVersion = history.length > 0 ? history[history.length-1].version : 0;
            const state = hydrate(history); // HYDRATE TO GET RAW MATERIALS

            const event = {
                type: ProductionCompleted,
                data: {
                    productionOrderId: command.aggregateId,
                    productId: state.productId, // From Scheduled
                    actualQuantity,
                    rawMaterials: state.rawMaterials, // From Scheduled
                    completedAt: Date.now()
                }
            };
            await commitEvents([event], currentVersion);
        }
    };
};

const hydrate = (events) => {
    const state = {};
    for (const e of events) {
        if (e.type === ProductionScheduled) {
            state.productId = e.data.productId;
            state.rawMaterials = e.data.rawMaterials;
            state.status = 'SCHEDULED';
        }
    }
    return state;
};
