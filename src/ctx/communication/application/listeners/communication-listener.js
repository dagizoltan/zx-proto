export const createCommunicationListener = ({ feedService, eventBus }) => {
    const setupSubscriptions = () => {
        // Subscribe to relevant domain events and post to Feed

        // --- Orders ---
        eventBus.subscribe('order.created', async (payload) => {
             // System Feed Post
             await feedService.postItem(payload.tenantId, {
                 type: 'SYSTEM',
                 title: 'New Order',
                 message: `Order #${payload.id.slice(0,8)} was created for $${payload.total}.`,
                 link: `/ims/orders/${payload.id}`,
                 author: 'System'
             });
        });

        // --- Manufacturing ---
        eventBus.subscribe('manufacturing.wo_completed', async (payload) => {
             await feedService.postItem(payload.tenantId, {
                 type: 'SYSTEM',
                 title: 'Production Completed',
                 message: `Work Order #${payload.code} is complete. Stock has been updated.`,
                 link: `/ims/manufacturing/work-orders/${payload.id}`,
                 author: 'System'
             });
        });

        // --- System ---
        eventBus.subscribe('access_control.user_registered', async (payload) => {
             await feedService.postItem(payload.tenantId, {
                 type: 'SYSTEM',
                 title: 'New User',
                 message: `User ${payload.name} has joined the organization.`,
                 link: `/ims/system/users/${payload.id}`,
                 author: 'System'
             });
        });
    };

    return { setupSubscriptions };
};
