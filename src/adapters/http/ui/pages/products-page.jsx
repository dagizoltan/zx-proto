import { h } from 'preact';

export const ProductsPage = ({ products, category, search, page }) => {
  return (
    <div class="products-page">
      <h1>Products</h1>

      <div class="filters">
        <form action="/products" method="GET">
            <input type="text" name="search" value={search} placeholder="Search products..." />
            <button type="submit">Search</button>
        </form>
      </div>

      <div class="product-grid">
        {products.map(product => (
          <div class="product-card">
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <p class="price">${product.price}</p>
            <a href={`/product/${product.id}`} class="btn">View</a>
          </div>
        ))}
      </div>

      {products.length === 0 && <p>No products found.</p>}
    </div>
  );
};
