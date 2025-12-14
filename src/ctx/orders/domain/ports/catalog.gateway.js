/**
 * Interface: Catalog Gateway
 * Port for accessing product information
 */
export const ICatalogGateway = {
  getProducts: async (tenantId, productIds) => { throw new Error('Not implemented'); },
  getProduct: async (tenantId, productId) => { throw new Error('Not implemented'); }
};
