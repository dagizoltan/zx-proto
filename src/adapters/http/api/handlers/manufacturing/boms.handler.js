import { toApiBOM } from '../../transformers/manufacturing.transformer.js';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const listBOMsHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const manufacturing = c.ctx.get('domain.manufacturing');

    // Use listBOMs (correct name)
    const result = unwrap(await manufacturing.useCases.listBOMs.execute(tenantId));
    return c.json({ items: result.items.map(toApiBOM) });
};

export const createBOMHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const manufacturing = c.ctx.get('domain.manufacturing');
    const data = c.get('validatedData');

    // Use createBOM (correct name)
    const bom = unwrap(await manufacturing.useCases.createBOM.execute(tenantId, data));
    return c.json(toApiBOM(bom), 201);
};
