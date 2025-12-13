import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';

/**
 * Adapter: Local Customer Gateway
 * Wraps the local Access Control Context to implement ICustomerGateway
 */
export const createLocalCustomerGatewayAdapter = (registry) => {
  return {
    getCustomer: async (tenantId, userId) => {
      const accessControl = registry.get('domain.access-control');
      if (!accessControl) {
        return Err({ code: 'ACCESS_CONTROL_UNAVAILABLE', message: 'Access Control context not available' });
      }

      const result = await accessControl.repositories.user.findById(tenantId, userId);
      if (isErr(result)) {
        return Err({ code: 'CUSTOMER_NOT_FOUND', message: 'Customer not found' });
      }

      if (!result.value) {
        return Err({ code: 'CUSTOMER_NOT_FOUND', message: 'Customer not found' });
      }

      return Ok(result.value);
    },

    exists: async (tenantId, userId) => {
      const accessControl = registry.get('domain.access-control');
      if (!accessControl) {
        return Err({ code: 'ACCESS_CONTROL_UNAVAILABLE', message: 'Access Control context not available' });
      }

      const result = await accessControl.repositories.user.findById(tenantId, userId);
      if (isErr(result)) return Ok(false);
      return Ok(result.value !== null);
    }
  };
};
