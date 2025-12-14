import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';

/**
 * Adapter: Local Catalog Gateway
 * Wraps the local Catalog Context to implement ICatalogGateway
 *
 * @param {Object} catalogContext - The actual Catalog Context instance
 */
export const createLocalCatalogGatewayAdapter = (catalogContext) => {
  return {
    getProducts: async (tenantId, productIds) => {
      if (!catalogContext) {
        return Err({ code: 'CATALOG_UNAVAILABLE', message: 'Catalog context not available' });
      }

      try {
        const products = [];
        for (const productId of productIds) {
          const result = await catalogContext.useCases.getProduct.execute(tenantId, productId);
          if (isErr(result)) {
            return Err({
              code: 'PRODUCT_NOT_FOUND',
              message: `Product ${productId} not found`
            });
          }
          products.push(result.value);
        }
        return Ok(products);
      } catch (error) {
        return Err({ code: 'CATALOG_ERROR', message: error.message });
      }
    },

    getProduct: async (tenantId, productId) => {
      if (!catalogContext) {
        return Err({ code: 'CATALOG_UNAVAILABLE', message: 'Catalog context not available' });
      }

      return await catalogContext.useCases.getProduct.execute(tenantId, productId);
    }
  };
};
