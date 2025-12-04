import { h } from 'preact';

export const CheckoutPage = ({ cart, user, total }) => {
  return (
    <div class="checkout-page">
      <h1>Checkout</h1>

      <div class="checkout-grid" style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem;">
        <div class="cart-summary">
          <h2>Your Cart</h2>
          {cart.items.length > 0 ? (
            <table class="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {cart.items.map(item => (
                  <tr>
                    <td>{item.name || item.productId}</td>
                    <td>{item.quantity}</td>
                    <td>${item.price}</td>
                    <td>${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
             <p>Your cart is empty.</p>
          )}
        </div>

        <div class="checkout-form-container">
            <div class="order-summary-card" style="background: white; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3>Order Summary</h3>
                <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; font-size: 1.25rem; font-weight: bold;">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                </div>

                <form action="/checkout" method="POST">
                    <input type="hidden" name="action" value="place_order" />

                    <h4>Payment Details</h4>
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem;">Card Number</label>
                        <input type="text" placeholder="**** **** **** ****" style="width: 100%; padding: 0.5rem;" disabled value="4242 4242 4242 4242 (Mock)" />
                    </div>

                     <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem;">Shipping Address</label>
                        <input type="text" name="address" placeholder="123 Main St" style="width: 100%; padding: 0.5rem;" required />
                    </div>

                    <button type="submit" class="btn btn-primary" style="width: 100%;" disabled={cart.items.length === 0}>
                        Place Order
                    </button>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
};
