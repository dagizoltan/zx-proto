import { toApiSupplier } from '../../transformers/procurement.transformer.js';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const listSuppliersHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const procurement = c.ctx.get('domain.procurement');

    const result = unwrap(await procurement.useCases.listSuppliers.execute(tenantId));
    // result is { items, nextCursor }
    return c.json({ items: result.items.map(toApiSupplier) });
};

export const createSupplierHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const procurement = c.ctx.get('domain.procurement');
    const data = c.get('validatedData');

    const supplier = unwrap(await procurement.useCases.createSupplier.execute(tenantId, data));
    return c.json(toApiSupplier(supplier), 201);
};
