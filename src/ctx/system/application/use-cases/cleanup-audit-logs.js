
export const createCleanupAuditLogsUseCase = (auditRepo) => {
    return {
        execute: async ({ tenantId, log }) => {
            log(`Starting cleanup of old audit logs for tenant ${tenantId}...`);

            // In a real implementation, we would have a deleteBefore(date) method in repo.
            // For now, we simulate it.

            // Calculate date 90 days ago
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 90);

            log(`Deleting logs older than ${cutoff.toISOString()}`);

            // const deletedCount = await auditRepo.deleteOlderThan(tenantId, cutoff);
            // log(`Deleted ${deletedCount} logs.`);

            // Mocking work
            await new Promise(r => setTimeout(r, 1000));
            log(`Cleanup complete (simulation).`);
        }
    }
};
