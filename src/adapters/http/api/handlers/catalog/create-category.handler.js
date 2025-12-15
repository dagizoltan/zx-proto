import { toApiCategory } from '../../transformers/catalog.transformer.js';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const createCategoryHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const catalog = c.ctx.get('domain.catalog');

    // Validated data from middleware
    // Expected: { name: string, parentId?: string, description?: string }
    const data = c.get('validatedData');

    const category = unwrap(await catalog.useCases.createCategory.execute(tenantId, data));

    // Optional: Audit log is handled by middleware or Use Case events?
    // Catalog use cases emit events, but let's audit here for consistency if needed.
    // However, auditMiddleware logs the request.

    return c.json(toApiCategory ? toApiCategory(category) : category, 201);
};
