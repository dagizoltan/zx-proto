import { h } from 'preact';

export const HomePage = ({ products }) => {
  return (
    <div class="home-page">
      <section class="hero">
        <h1>Welcome to IMS Shopfront</h1>
        <p>Your one-stop shop for everything.</p>
        <a href="/products" class="btn btn-primary">Shop Now</a>
      </section>

      <section class="featured-products">
        <h2>Featured Products</h2>
        <div class="product-grid">
          {products.length > 0 ? (
            products.map(product => (
              <div class="product-card">
                <h3>{product.name}</h3>
                <p class="price">${product.price}</p>
                <a href={`/product/${product.id}`} class="btn">View Details</a>
              </div>
            ))
          ) : (
            <p>No products available yet.</p>
          )}
        </div>
      </section>
    </div>
  );
};
