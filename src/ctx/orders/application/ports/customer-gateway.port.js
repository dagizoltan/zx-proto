/**
 * Port: Customer Gateway
 * Abstracts communication with Access Control Context
 */
export const ICustomerGateway = {
  /**
   * @param {string} tenantId
   * @param {string} userId
   * @returns {Promise<Result<User>>}
   */
  getCustomer: (tenantId, userId) => {
    throw new Error('Port method must be implemented');
  },

  /**
   * @param {string} tenantId
   * @param {string} userId
   * @returns {Promise<Result<boolean>>}
   */
  exists: (tenantId, userId) => {
    throw new Error('Port method must be implemented');
  }
};
