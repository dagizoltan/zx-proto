import { Hono } from 'hono';
import { serveStatic } from 'hono/middleware.ts';
import { indexRoutes } from './routes/index-routes.js';
import { productsRoutes } from './routes/products-routes.js';
import { productDetailRoutes } from './routes/product-detail-routes.js';
import { adminRoutes } from './routes/admin-routes.js';
import { checkoutRoutes } from './routes/checkout-routes.js';

export const createUIApp = () => {
  const ui = new Hono();

  // Serve static files
  ui.use('/static/*', serveStatic({ root: './src/adapters/http/ui' }));

  // UI-specific middleware - parse cookies for session
  ui.use('*', async (c, next) => {
    const cookie = c.req.header('cookie');
    if (cookie) {
      const sessionToken = cookie
        .split(';')
        .find(c => c.trim().startsWith('session='))
        ?.split('=')[1];

      if (sessionToken) {
        try {
          const security = c.ctx.get('infra.security');
          const user = await security.jwtProvider.verify(sessionToken);
          c.set('user', user);
        } catch (e) {
          // Invalid session, continue without user
        }
      }
    }
    await next();
  });

  // Mount routes
  ui.route('/', indexRoutes);
  ui.route('/products', productsRoutes);
  ui.route('/product', productDetailRoutes);
  ui.route('/admin', adminRoutes);
  ui.route('/checkout', checkoutRoutes);

  // Auth Routes
  ui.route('/', authRoutes);

  return ui;
};

import { Hono } from 'hono';
import { renderPage } from './renderer.js';
import { LoginPage } from './pages/auth/login-page.jsx';
import { RegisterPage } from './pages/auth/register-page.jsx';
import { AuthLayout } from './layouts/auth-layout.jsx';

const authRoutes = new Hono();

authRoutes.get('/login', async (c) => {
  const html = await renderPage(LoginPage, {
    layout: AuthLayout,
    title: 'Sign In - IMS Shopfront'
  });
  return c.html(html);
});

authRoutes.post('/login', async (c) => {
  const { email, password } = await c.req.parseBody();
  const accessControl = c.ctx.get('domain.accessControl');
  const tenantId = c.get('tenantId');

  try {
    const { token } = await accessControl.useCases.loginUser.execute(tenantId, email, password);

    // Set cookie
    c.header('Set-Cookie', `session=${token}; Path=/; HttpOnly; SameSite=Strict`);

    // Redirect to home or intended url
    const redirect = c.req.query('redirect') || '/';
    return c.redirect(redirect);
  } catch (error) {
    const html = await renderPage(LoginPage, {
      layout: AuthLayout,
      title: 'Sign In - IMS Shopfront',
      error: error.message,
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
  const accessControl = c.ctx.get('domain.accessControl');
  const tenantId = c.get('tenantId');

  try {
    // Register
    await accessControl.useCases.registerUser.execute(tenantId, { email, password, name });

    // Auto login
    const { token } = await accessControl.useCases.loginUser.execute(tenantId, email, password);
    c.header('Set-Cookie', `session=${token}; Path=/; HttpOnly; SameSite=Strict`);

    return c.redirect('/');
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
