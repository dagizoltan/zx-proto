/**
 * Port: User Repository
 * Primary adapter: Application Use Cases
 * Secondary adapter: KV/SQL/Memory implementations
 */
export const IUserRepository = {
  /**
   * @param {string} tenantId
   * @param {User} user - Domain entity
   * @returns {Promise<Result<User>>}
   */
  save: (tenantId, user) => {
    throw new Error('Port method must be implemented');
  },

  /**
   * @param {string} tenantId
   * @param {string} id
   * @returns {Promise<Result<User>>}
   */
  findById: (tenantId, id) => {
    throw new Error('Port method must be implemented');
  },

  /**
   * @param {string} tenantId
   * @param {string} email
   * @returns {Promise<Result<User>>}
   */
  findByEmail: (tenantId, email) => {
    throw new Error('Port method must be implemented');
  },

   /**
   * @param {string} tenantId
   * @param {object} options
   * @returns {Promise<Result<{items: User[], total: number}>>}
   */
  list: (tenantId, options) => {
    throw new Error('Port method must be implemented');
  },

  /**
   * @param {string} tenantId
   * @param {string} indexName
   * @param {string} value
   * @param {object} options
   * @returns {Promise<Result<{items: User[], total: number}>>}
   */
  queryByIndex: (tenantId, indexName, value, options) => {
    throw new Error('Port method must be implemented');
  }
};
