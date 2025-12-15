import { unwrap } from '../../../../../../lib/trust/index.js'; // 6 levels

export const loginHandler = async (c) => {
    const { email, password } = c.get('validatedData');
    const tenantId = c.get('tenantId');

    const accessControl = c.ctx.get('domain.access-control');
    const obs = c.ctx.get('domain.observability').obs;

    try {
      const result = unwrap(await accessControl.useCases.loginUser.execute(tenantId, email, password));

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
  };
