import { Ok, Err, isErr, unwrap } from '../../../../../lib/trust/index.js';

export const createGetPickingList = ({ stockMovementRepository, registry }) => {
    const execute = async (tenantId, orderId) => {
        const catalog = registry.get('domain.catalog');
        const inventory = registry.get('domain.inventory');

        // Resolvers for population
        const resolvers = {
            product: (ids) => catalog.repositories.product.findByIds(tenantId, ids),
            fromLocation: (ids) => inventory.repositories.location.findByIds(tenantId, ids),
            batch: (ids) => inventory.repositories.batch.findByIds(tenantId, ids)
        };

        const moveRes = await stockMovementRepository.query(tenantId, {
            filter: { reference: orderId, type: 'ALLOCATION' }, // repo.query uses 'reference' index
            limit: 1000,
            populate: ['product', 'fromLocation', 'batch']
        }, { resolvers });

        if (isErr(moveRes)) return moveRes;

        const movements = moveRes.value.items;

        const pickItems = movements.map(item => ({
            ...item,
            productName: item.product?.name || 'Unknown',
            sku: item.product?.sku || 'UNKNOWN',
            locationCode: item.fromLocation?.code || 'Unknown Loc',
            batchNumber: item.batch?.batchNumber,
            expiryDate: item.batch?.expiryDate
        }));

        // Sort by Location Code
        pickItems.sort((a, b) => (a.locationCode || '').localeCompare(b.locationCode || ''));

        return Ok(pickItems);
    };

    return { execute };
};
