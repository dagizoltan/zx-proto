import { h } from 'preact';

export const ProductDetailPage = ({ product, available, user }) => {
  return (
    <div class="product-detail-page">
      <h1>{product.name}</h1>
      <div class="product-info">
        <p class="price">${product.price}</p>
        <p class="description">{product.description}</p>
        <p class="sku">SKU: {product.sku}</p>

        {available ? (
            <div class="actions">
                <form action="/checkout" method="POST">
                    {/* Simplified checkout for demo: assume single item buy or add to cart logic */}
                    <input type="hidden" name="productId" value={product.id} />
                    <input type="number" name="quantity" value="1" min="1" max={product.quantity} />
                    <button type="submit" class="btn btn-primary">Buy Now</button>
                </form>
            </div>
        ) : (
            <p class="out-of-stock">Out of Stock</p>
        )}
      </div>
    </div>
  );
};
