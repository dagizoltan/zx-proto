/**
 * Port: Inventory Gateway
 * Abstracts communication with Inventory Context
 */
export const IInventoryGateway = {
  /**
   * @param {string} tenantId
   * @param {Array<{productId: string, quantity: number}>} items
   * @param {string} orderId
   * @returns {Promise<Result<boolean>>}
   */
  reserveStock: (tenantId, items, orderId) => {
    throw new Error('Port method must be implemented');
  },

  /**
   * @param {string} tenantId
   * @param {string} orderId
   * @returns {Promise<Result<boolean>>}
   */
  releaseStock: (tenantId, orderId) => {
    throw new Error('Port method must be implemented');
  },

  /**
   * @param {string} tenantId
   * @param {string} orderId
   * @param {Array} items
   * @returns {Promise<Result<boolean>>}
   */
  confirmShipment: (tenantId, orderId, items) => {
    throw new Error('Port method must be implemented');
  }
};
