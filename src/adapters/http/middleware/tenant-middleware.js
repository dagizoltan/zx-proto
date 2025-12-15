import { isErr } from '../../../../lib/trust/index.js';
import { ErrorCodes } from '../../../utils/error-codes.js';

export const tenantMiddleware = async (c, next) => {
  const host = c.req.header('host') || '';
  let tenantId = 'default';

  // 1. Host-based Resolution (Subdomain) - Higher Security
  // e.g. tenant1.app.com -> tenant1
  const parts = host.split('.');
  // Check against localhost or IP addresses to avoid false positives
  const isLocalOrIp = host.includes('localhost') || host.match(/^\d+\.\d+\.\d+\.\d+/);

  if (!isLocalOrIp && parts.length > 2) {
    tenantId = parts[0];
  } else {
    // 2. Header-based Resolution (Fallback / Dev)
    const headerTenant = c.req.header('x-tenant-id');
    if (headerTenant) {
      tenantId = headerTenant;
    }
  }

  // Set tenantId early so it's available
  c.set('tenantId', tenantId);

  // 3. Security Validation
  // If the user is attempting to authenticate (sending a token),
  // we must ensure they belong to this tenant to prevent spoofing.
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      // Access security infra from context
      const jwtProvider = c.ctx.get('infra.security').jwtProvider;

      // Verify token signature
      const payload = await jwtProvider.verify(token);

      // Check if user exists in the resolved tenant
      // We need access to the user repository
      const accessControl = c.ctx.get('domain.access-control');
      if (accessControl && accessControl.repositories && accessControl.repositories.user) {
         // The user ID in the token must exist in the context of the requested tenantId.
         // If a user belongs to Tenant A, but tries to access Tenant B with that token,
         // findById(Tenant B, UserId) will fail (return NOT_FOUND or null).
         const userRes = await accessControl.repositories.user.findById(tenantId, payload.id);

         // Handle Result type properly
         if (isErr(userRes)) {
            // Propagate unexpected errors? Or just treat as not found?
             // If NOT_FOUND, it means user doesn't exist in tenant.
             if (userRes.error.code === ErrorCodes.NOT_FOUND) {
                 return c.json({ error: 'Unauthorized: User does not belong to this tenant' }, 403);
             }
             // For other errors (DB down), we might want to fail safe or log.
             // Let's return 403 to be safe.
             return c.json({ error: 'Unauthorized: Unable to verify tenant access' }, 403);
         }

         const user = userRes.value;

         if (!user) {
             // Should be covered by isErr check if repo returns Result, but just in case.
             return c.json({ error: 'Unauthorized: User does not belong to this tenant' }, 403);
         }
      }
    } catch (e) {
      // Token invalid or verification failed.
      // We let the actual authMiddleware handle the 401 later.
      // We only care here if it WAS valid but for the wrong tenant.
    }
  }

  await next();
};
