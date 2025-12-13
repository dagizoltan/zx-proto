/**
 * Port: Order Repository
 * Primary adapter: Application Use Cases
 * Secondary adapter: KV implementations
 */
export const IOrderRepository = {
  /**
   * @param {string} tenantId
   * @param {Order} order - Domain entity
   * @returns {Promise<Result<Order>>}
   */
  save: (tenantId, order) => {
    throw new Error('Port method must be implemented');
  },

  /**
   * @param {string} tenantId
   * @param {string} id
   * @returns {Promise<Result<Order>>}
   */
  findById: (tenantId, id) => {
    throw new Error('Port method must be implemented');
  },

  /**
   * @param {string} tenantId
   * @param {object} options
   * @returns {Promise<Result<{items: Order[], total: number}>>}
   */
  query: (tenantId, options) => {
    throw new Error('Port method must be implemented');
  }
};
