import { toApiSupplier } from '../../transformers/procurement.transformer.js';

export const listSuppliersHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const procurement = c.ctx.get('domain.procurement');

    // Check use cases available: 'po-use-cases.js', 'supplier-use-cases.js'.
    // Assuming 'listSuppliers' is in supplier-use-cases.
    const suppliers = await procurement.useCases.listSuppliers.execute(tenantId);

    // Assuming it returns array or { items }
    const list = Array.isArray(suppliers) ? suppliers : (suppliers.items || []);
    return c.json({ items: list.map(toApiSupplier) });
};

export const createSupplierHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const procurement = c.ctx.get('domain.procurement');
    const data = c.get('validatedData');

    const supplier = await procurement.useCases.createSupplier.execute(tenantId, data);
    return c.json(toApiSupplier(supplier), 201);
};
