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
         const user = await accessControl.repositories.user.findById(tenantId, payload.id);

         if (!user) {
             // User has a valid token but does not exist in this tenant.
             // This indicates a cross-tenant access attempt (Spoofing).
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
