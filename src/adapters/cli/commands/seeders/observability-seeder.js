// Observability Seeder (Logs)
import { faker } from './utils.js';

export const seedObservability = async (ctx, tenantId) => {
    console.log('🌱 Seeding Observability Logs...');

    const obs = ctx.get('domain.observability').obs;

    // Generate a burst of logs
    for(let i=0; i<20; i++) {
        const action = faker.hacker.verb();
        const component = faker.hacker.noun();

        await obs.info(`System ${action} on ${component}`, { tenantId, action, component });

        if (i % 5 === 0) {
            await obs.warn(`High latency detected in ${component}`, { tenantId, latency: faker.number.int({ min: 200, max: 1000 }) + 'ms' });
        }
    }

    await obs.error('Database connection timeout (simulation)', { tenantId, db: 'primary' });

    await obs.activity('User navigated to dashboard', { tenantId, userId: 'admin', path: '/dashboard' });
    await obs.activity('User exported report', { tenantId, userId: 'manager', report: 'Q3 Sales' });

    await obs.audit('User role changed', { tenantId, userId: 'admin', targetUser: faker.internet.userName(), oldRole: 'user', newRole: 'manager' });

    console.log('✅ Observability logs generated.');
};
