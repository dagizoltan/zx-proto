/**
 * Interface: Customer Gateway
 * Port for accessing customer information
 */
export const ICustomerGateway = {
  getCustomer: async (tenantId, userId) => { throw new Error('Not implemented'); },
  exists: async (tenantId, userId) => { throw new Error('Not implemented'); }
};
