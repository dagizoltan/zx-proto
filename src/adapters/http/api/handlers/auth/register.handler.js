export const registerHandler = async (c) => {
    const { email, password, name } = c.get('validatedData');
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
  };
