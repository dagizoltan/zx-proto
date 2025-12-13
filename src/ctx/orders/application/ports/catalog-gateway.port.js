/**
 * Port: Catalog Gateway
 * Abstracts communication with Catalog Context
 */
export const ICatalogGateway = {
  /**
   * @param {string} tenantId
   * @param {string[]} productIds
   * @returns {Promise<Result<Product[]>>}
   */
  getProducts: (tenantId, productIds) => {
    throw new Error('Port method must be implemented');
  },

  /**
   * @param {string} tenantId
   * @param {string} productId
   * @returns {Promise<Result<Product>>}
   */
  getProduct: (tenantId, productId) => {
    throw new Error('Port method must be implemented');
  }
};
