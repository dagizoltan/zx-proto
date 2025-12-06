import { Hono } from 'hono';
import { serveStatic } from 'hono/middleware.ts';
import { indexRoutes } from './routes/index-routes.js';
import { productsRoutes } from './routes/products-routes.js';
import { productDetailRoutes } from './routes/product-detail-routes.js';
import { imsRoutes } from './routes/ims-routes.js';
import { checkoutRoutes } from './routes/checkout-routes.js';
import { authRoutes } from './routes/auth-routes.js';

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
  ui.route('/ims', imsRoutes);
  ui.route('/checkout', checkoutRoutes);
  ui.route('/', authRoutes);

  return ui;
};
