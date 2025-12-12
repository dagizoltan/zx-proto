
import { createObsContext } from './src/infra/obs/index.js';
import { createPersistenceContext } from './src/infra/persistence/index.js';
import { createConfigService } from './src/utils/config/config-service.js';

const run = async () => {
    console.log('Verifying Obs Context...');
    const config = await createConfigService('local');
    const persistence = await createPersistenceContext({ config });

    console.log('Persistence initialized. kvPool:', !!persistence.kvPool);
    console.log('kvPool.withConnection type:', typeof persistence.kvPool.withConnection);

    const obs = await createObsContext({ config, persistence });

    console.log('Obs initialized.');
    console.log('Testing info log...');
    await obs.info('Test log', { tenantId: 'default' });
    console.log('Test log complete.');
};

run().catch(e => console.error(e));
