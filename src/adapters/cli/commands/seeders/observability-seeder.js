// Observability Seeder (Logs)
// Ideally we rely on the system generating logs, but we can backfill some for demo.

export const seedObservability = async (ctx, tenantId) => {
    console.log('🌱 Seeding Observability Logs...');

    const obs = ctx.get('infra.obs');

    // Past logs need manual insertion via repo if we want backdated ones,
    // but the obs service usually timestamps NOW.
    // For demo purposes, we will just generate some current logs.

    await obs.info('System seeded successfully', { tenantId, action: 'SEED' });
    await obs.warn('Disk usage warning (simulation)', { tenantId, metric: 'disk_usage', value: '85%' });
    await obs.error('Failed login attempt (simulation)', { tenantId, user: 'unknown@example.com' });

    await obs.activity('User navigated to dashboard', { tenantId, userId: 'demo-user', path: '/dashboard' });

    await obs.audit('User role changed', { tenantId, userId: 'admin', targetUser: 'john.doe', oldRole: 'user', newRole: 'manager' });

    console.log('✅ Observability logs generated.');
};
