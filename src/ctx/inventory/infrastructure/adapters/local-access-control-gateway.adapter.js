import { Ok, Err, isErr, unwrap } from '../../../../../lib/trust/index.js';

/**
 * Adapter: Local Access Control Gateway
 * Wraps the local Access Control Context to implement IAccessControlGateway
 *
 * @param {Object} accessControlContext
 */
export const createLocalAccessControlGatewayAdapter = (accessControlContext) => {
    return {
        checkPermission: async (tenantId, userId, resource, action) => {
            if (!accessControlContext) {
                 return Err({ code: 'ACCESS_CONTROL_UNAVAILABLE', message: 'Access Control context not available' });
            }
            return await accessControlContext.useCases.checkPermission.execute(tenantId, userId, resource, action);
        }
    }
}
