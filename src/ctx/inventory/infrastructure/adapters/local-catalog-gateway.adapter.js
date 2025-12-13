import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';

/**
 * Adapter: Local Catalog Gateway
 * Wraps the local Catalog Context to implement ICatalogGateway.
 */
export const createLocalCatalogGatewayAdapter = (registry) => {
  return {
    getProduct: async (tenantId, productId) => {
        const cat = registry.get('domain.catalog');
        if (!cat) throw new Error('Catalog domain not available');
        return cat.useCases.getProduct.execute(tenantId, productId);
    },
    exists: async (tenantId, productId) => {
        const cat = registry.get('domain.catalog');
        if (!cat) throw new Error('Catalog domain not available');
        const res = await cat.useCases.getProduct.execute(tenantId, productId);
        return Ok(!isErr(res));
    },
    list: async (tenantId, options) => {
        const cat = registry.get('domain.catalog');
        if (!cat) throw new Error('Catalog domain not available');
        // FIX: Pass options as an object, not positional arguments
        return cat.useCases.listProducts.execute(tenantId, options);
    }
  };
};
