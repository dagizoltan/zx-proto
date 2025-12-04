export const authMiddleware = async (c, next) => {
  const user = c.get('user');

  if (!user) {
    // Redirect to login for UI routes
    return c.redirect(`/login?redirect=${encodeURIComponent(c.req.path)}`);
  }

  await next();
};
