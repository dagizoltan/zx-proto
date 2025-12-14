import { Ok, Err, isErr, unwrap } from '../../../../../lib/trust/index.js';

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
        // Optimization: Use repository direct access for batch retrieval if available
        // to avoid N+1 N-Use-Case calls.
        if (catalogContext.repositories && catalogContext.repositories.product) {
             // Repository methods return Result, so we return it directly.
             return await catalogContext.repositories.product.findByIds(tenantId, productIds);
        }

        // Fallback to loop if repo not exposed
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
    },

    list: async (tenantId, options) => {
       if (!catalogContext) {
        return Err({ code: 'CATALOG_UNAVAILABLE', message: 'Catalog context not available' });
      }

      try {
          if (catalogContext.repositories && catalogContext.repositories.product) {
              return await catalogContext.repositories.product.query(tenantId, options);
          }

          return Err({ code: 'CATALOG_ERROR', message: 'Catalog repository not exposed' });

      } catch (e) {
          return Err({ code: 'CATALOG_ERROR', message: e.message });
      }
    }
  };
};
