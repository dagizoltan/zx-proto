import { Hono } from 'hono';

export const authRoutes = new Hono();

authRoutes.post('/login', async (c) => {
  const { email, password } = await c.req.json();
  const tenantId = c.get('tenantId');

  // Access domain context through c.ctx
  const accessControl = c.ctx.get('domain.access-control');
  const obs = c.ctx.get('infra.obs');

  try {
    const result = await accessControl.useCases.loginUser.execute(tenantId, email, password);

    await obs.audit('User logged in', {
      tenantId,
      userId: result.user.id,
      email: result.user.email,
    });

    return c.json({
      success: true,
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    await obs.warn('Login failed', {
      email,
      error: error.message,
    });

    return c.json(
      { error: 'Invalid credentials' },
      401
    );
  }
});

authRoutes.post('/register', async (c) => {
  const { email, password, name } = await c.req.json();
  const tenantId = c.get('tenantId');

  const accessControl = c.ctx.get('domain.access-control');
  const obs = c.ctx.get('infra.obs');

  try {
    const user = await accessControl.useCases.registerUser.execute(tenantId, {
      email,
      password,
      name,
    });

    await obs.audit('User registered', {
      tenantId,
      userId: user.id,
      email: user.email,
    });

    return c.json({
      success: true,
      user,
    }, 201);
  } catch (error) {
    await obs.error('Registration failed', {
      email,
      error: error.message,
    });

    return c.json(
      { error: error.message },
      400
    );
  }
});
