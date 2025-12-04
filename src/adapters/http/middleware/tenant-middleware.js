export const tenantMiddleware = async (c, next) => {
  // Extract tenant from subdomain: store1.domain.com -> store1
  // Or from header: X-Tenant-ID

  const host = c.req.header('host') || '';
  let tenantId = 'default';

  // Try header first
  const headerTenant = c.req.header('x-tenant-id');
  if (headerTenant) {
    tenantId = headerTenant;
  } else {
    // Try subdomain
    const parts = host.split('.');
    if (parts.length > 2) { // e.g. tenant.domain.com
        tenantId = parts[0];
    }
  }

  // Attach to context
  c.set('tenantId', tenantId);

  // We can also validate if tenant exists here by checking KV
  // const tenant = await kv.get(['tenants', tenantId]); ...

  await next();
};
