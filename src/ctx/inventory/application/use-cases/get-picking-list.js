import { Ok, Err, isErr, unwrap } from '../../../../../lib/trust/index.js';

export const createGetPickingList = ({
    stockMovementRepository,
    catalogGateway,
    locationRepository,
    batchRepository
}) => {
    const execute = async (tenantId, orderId) => {
        // Resolvers for population
        const resolvers = {
            product: (ids) => catalogGateway.getProducts(tenantId, ids), // Using gateway which returns Result<Product[]>
            fromLocation: (ids) => locationRepository.findByIds(tenantId, ids),
            batch: (ids) => batchRepository.findByIds(tenantId, ids)
        };

        const moveRes = await stockMovementRepository.query(tenantId, {
            filter: { referenceId: orderId, type: 'ALLOCATION' }, // repo.query uses 'referenceId' index
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
