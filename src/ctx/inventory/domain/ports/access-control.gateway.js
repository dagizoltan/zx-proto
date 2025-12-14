/**
 * Interface: Access Control Gateway
 * Port for accessing permission checks
 */
export const IAccessControlGateway = {
  checkPermission: async (tenantId, userId, resource, action) => { throw new Error('Not implemented'); }
};
