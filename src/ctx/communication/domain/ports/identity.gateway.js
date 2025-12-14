/**
 * Interface: Identity Gateway
 * Port for accessing identity/user information
 */
export const IIdentityGateway = {
  getUser: async (tenantId, userId) => { throw new Error('Not implemented'); },
  // Add other methods if identity.adapter.js has them
};
