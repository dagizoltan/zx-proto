/**
 * Port: Role Repository
 * Primary adapter: Application Use Cases
 * Secondary adapter: KV/SQL/Memory implementations
 */
export const IRoleRepository = {
  /**
   * @param {string} tenantId
   * @param {Role} role - Domain entity
   * @returns {Promise<Result<Role>>}
   */
  save: (tenantId, role) => {
    throw new Error('Port method must be implemented');
  },

  /**
   * @param {string} tenantId
   * @param {string} id
   * @returns {Promise<Result<Role>>}
   */
  findById: (tenantId, id) => {
    throw new Error('Port method must be implemented');
  },

  /**
   * @param {string} tenantId
   * @param {string[]} ids
   * @returns {Promise<Result<Role[]>>}
   */
  findByIds: (tenantId, ids) => {
    throw new Error('Port method must be implemented');
  },

  /**
   * @param {string} tenantId
   * @param {object} options
   * @returns {Promise<Result<{items: Role[], total: number}>>}
   */
  list: (tenantId, options) => {
    throw new Error('Port method must be implemented');
  }
};
