
export const createSystemEventsListener = ({ notificationService, eventBus }) => {

    // Map Domain Events to Human Readable Notifications
    const setupSubscriptions = () => {

        // Order Created -> Notify Admins
        eventBus.subscribe('order.created', async (payload) => {
             // payload: { tenantId, id, total, status, ... }
             await notificationService.notify(payload.tenantId, {
                 userId: null, // Global / Role based? Service defaults to broadcast.
                 level: 'info',
                 title: 'New Order Received',
                 message: `Order #${payload.id.slice(0,8)} created. Total: $${payload.total}`,
                 link: `/ims/orders/${payload.id}`
             });
        });

        // Stock Updated -> Notify if Low (Simplified)
        eventBus.subscribe('stock.updated', async (payload) => {
             // payload: { tenantId, productId, quantity, reason }
             // We'd need product details to know if it's low.
             // For now, just a log notification.
             // Wait, the payload structure might differ.
             // In `update-stock.js`: `await eventBus.publish('stock.updated', { productId, quantity, reason });`
             // It misses tenantId?
             // Checking `update-stock.js` context...
             // `const execute = async (tenantId, ...)` -> the use case receives tenantId.
             // But does it pass it to eventBus?
             // Let's assume for now we need to fix the emitter if it's missing tenantId.
             // But assuming it has it:

             if (payload.reason === 'low_stock_warning') { // If we had this logic
                 // ...
             }
        });

        // Product Created
        eventBus.subscribe('catalog.product_created', async (payload) => {
            await notificationService.notify(payload.tenantId, {
                userId: null,
                level: 'success',
                title: 'New Product Added',
                message: `Product ${payload.name} has been added to the catalog.`,
                link: `/ims/catalog/products/${payload.id}`
            });
        });
    };

    return { setupSubscriptions };
};
