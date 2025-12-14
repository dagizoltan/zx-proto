export const createSubscribeNotifications = ({ eventBus }) => {
    return (tenantId, userId) => {
        // Return a readable stream
        return new ReadableStream({
            start(controller) {
                // Subscribe to events
                // We subscribe to 'notification.created'

                const handler = (payload) => {
                    // Filter by tenant and user
                    if (payload.tenantId === tenantId && (payload.userId === userId || !payload.userId)) {
                        const data = JSON.stringify(payload);
                        try {
                            controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
                        } catch (e) {
                            // Controller might be closed
                            console.error('Error enqueuing notification', e);
                        }
                    }
                };

                const unsubscribe = eventBus.subscribe('notification.created', handler);

                // Ping to keep connection alive
                const interval = setInterval(() => {
                    try {
                        controller.enqueue(new TextEncoder().encode(': ping\n\n'));
                    } catch (e) {
                         clearInterval(interval);
                    }
                }, 15000);

                // Store cleanup logic on the controller object itself if needed,
                // but standard way is `cancel()` callback.
                this.cleanup = () => {
                    clearInterval(interval);
                    if (unsubscribe) unsubscribe();
                };
            },
            cancel() {
                if (this.cleanup) this.cleanup();
            }
        });
    };
};
