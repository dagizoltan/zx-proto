import { Hono } from 'hono';
import { renderPage } from '../renderer.js';
import { CheckoutPage } from '../pages/checkout-page.jsx';
import { authMiddleware } from '../middleware/auth-middleware.js';
import { addItem, removeItem } from '../../../../ctx/orders/domain/entities/cart.js';
import { unwrap, isErr } from '../../../../../lib/trust/index.js'; // 5 levels

export const checkoutRoutes = new Hono();

// Protect checkout routes
checkoutRoutes.use('*', authMiddleware);

checkoutRoutes.get('/', async (c) => {
  const user = c.get('user');
  const tenantId = c.get('tenantId');
  const cache = c.ctx.get('infra.persistence').cache;
  const catalog = c.ctx.get('domain.catalog'); // Was inventory, now catalog has getProduct

  // Get cart from cache/session
  const cartKey = `${tenantId}:cart:${user.id}`;
  const cart = await cache.get(cartKey) || { items: [] };

  // Enrich cart items with details
  let total = 0;
  const enrichedItems = [];

  for (const item of cart.items) {
      const res = await catalog.useCases.getProduct.execute(tenantId, item.productId);
      if (res.ok) {
          const product = res.value;
          enrichedItems.push({
              ...item,
              name: product.name,
              price: product.price
          });
          total += product.price * item.quantity;
      }
  }

  const html = await renderPage(CheckoutPage, {
    user,
    cart: { items: enrichedItems },
    total,
    title: 'Checkout - IMS Shopfront'
  });

  return c.html(html);
});

checkoutRoutes.post('/', async (c) => {
  const user = c.get('user');
  const tenantId = c.get('tenantId');
  const orders = c.ctx.get('domain.orders');
  const cache = c.ctx.get('infra.persistence').cache;
  const obs = c.ctx.get('domain.observability').obs;

  const formData = await c.req.parseBody();
  const action = formData.action;

  const cartKey = `${tenantId}:cart:${user.id}`;
  let cart = await cache.get(cartKey) || { items: [] };

  if (action === 'add') {
       // Add to cart
       const productId = formData.productId;
       const quantity = parseInt(formData.quantity || '1');
       cart = addItem(cart, productId, quantity);
       await cache.set(cartKey, cart);
       return c.redirect('/products');
  }

  if (action === 'place_order') {
      if (!cart || cart.items.length === 0) {
        return c.redirect('/products');
      }

      try {
        // Create order
        // Unwrap Result
        const order = unwrap(await orders.useCases.createOrder.execute(tenantId, user.id, cart.items));

        // Clear cart
        await cache.del(cartKey);

        await obs.success('Order placed', {
          orderId: order.id,
          userId: user.id,
          total: order.totalAmount, // Fixed: total -> totalAmount
        });

        // Redirect to order confirmation (mocked)
        return c.html(`<h1>Order Placed! ID: ${order.id}</h1><a href="/">Continue Shopping</a>`);
      } catch (error) {
        await obs.error('Checkout failed', {
          error: error.message,
          userId: user.id,
        });

        return c.html(`
          <html>
            <body>
              <h1>Checkout Error</h1>
              <p>${error.message}</p>
              <a href="/checkout">Try again</a>
            </body>
          </html>
        `, 400);
      }
  }

  return c.redirect('/checkout');
});
