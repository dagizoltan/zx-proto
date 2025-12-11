import { Hono } from 'hono';
import { renderPage } from '../renderer.js';
import { LoginPage } from '../pages/auth/login-page.jsx';
import { RegisterPage } from '../pages/auth/register-page.jsx';
import { AuthLayout } from '../layouts/auth-layout.jsx';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const authRoutes = new Hono();

authRoutes.get('/login', async (c) => {
  const html = await renderPage(LoginPage, {
    layout: AuthLayout,
    title: 'Sign In - IMS Shopfront'
  });
  return c.html(html);
});

authRoutes.post('/login', async (c) => {
  const { email, password } = await c.req.parseBody();
  const accessControl = c.ctx.get('domain.access-control');
  const tenantId = c.get('tenantId');

  try {
    const res = await accessControl.useCases.loginUser.execute(tenantId, email, password);
    const { token } = unwrap(res);

    // Set cookie
    c.header('Set-Cookie', `session=${token}; Path=/; HttpOnly; SameSite=Strict`);

    // Redirect to home or intended url
    const redirect = c.req.query('redirect') || '/ims/dashboard'; // Changed from '/' to '/ims/dashboard'
    return c.redirect(redirect);
  } catch (error) {
    const html = await renderPage(LoginPage, {
      layout: AuthLayout,
      title: 'Sign In - IMS Shopfront',
      error: error.message || 'Invalid credentials', // Handle error properly
      email
    });
    return c.html(html);
  }
});

authRoutes.get('/logout', (c) => {
  c.header('Set-Cookie', `session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`);
  return c.redirect('/login');
});

authRoutes.get('/register', async (c) => {
  const html = await renderPage(RegisterPage, {
    layout: AuthLayout,
    title: 'Sign Up - IMS Shopfront'
  });
  return c.html(html);
});

authRoutes.post('/register', async (c) => {
  const { email, password, name } = await c.req.parseBody();
  const accessControl = c.ctx.get('domain.access-control');
  const tenantId = c.get('tenantId');

  try {
    // Register
    unwrap(await accessControl.useCases.registerUser.execute(tenantId, { email, password, name }));

    // Auto login
    const loginRes = await accessControl.useCases.loginUser.execute(tenantId, email, password);
    const { token } = unwrap(loginRes);

    c.header('Set-Cookie', `session=${token}; Path=/; HttpOnly; SameSite=Strict`);

    return c.redirect('/ims/dashboard'); // Changed from '/'
  } catch (error) {
    const html = await renderPage(RegisterPage, {
      layout: AuthLayout,
      title: 'Sign Up - IMS Shopfront',
      error: error.message,
      email,
      name
    });
    return c.html(html);
  }
});
