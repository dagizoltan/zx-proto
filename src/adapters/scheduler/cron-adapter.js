
export const createCronAdapter = (schedulerService) => {
    // This function will be called during bootstrap
    const start = () => {
        console.log('⏰ Starting Scheduler Ticker...');

        // Run every minute
        Deno.cron("Scheduler Ticker", "* * * * *", async () => {
            try {
                // In a multi-tenant system, we might need to iterate all tenants.
                // For now, we assume 'default' or single tenant usage,
                // or the service handles iteration if passed a wildcard.
                // Given the codebase, let's assume 'default' for now as seen in other places,
                // OR better, we iterate known tenants.

                // For this MVP, we hardcode 'default'.
                await schedulerService.tick('default');
            } catch (e) {
                console.error('❌ Scheduler Ticker Failed:', e);
            }
        });
    };

    return { start };
};
