import { toApiBOM } from '../../transformers/manufacturing.transformer.js';

export const listBOMsHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const manufacturing = c.ctx.get('domain.manufacturing');

    // Check use cases: 'bom-use-cases.js', 'wo-use-cases.js'
    const boms = await manufacturing.useCases.listBillOfMaterials.execute(tenantId);

    const list = Array.isArray(boms) ? boms : (boms.items || []);
    return c.json({ items: list.map(toApiBOM) });
};

export const createBOMHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const manufacturing = c.ctx.get('domain.manufacturing');
    const data = c.get('validatedData');

    const bom = await manufacturing.useCases.createBillOfMaterials.execute(tenantId, data);
    return c.json(toApiBOM(bom), 201);
};
