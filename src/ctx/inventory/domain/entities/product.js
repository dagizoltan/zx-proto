export const createProduct = ({ id, sku, name, price, quantity, description, category }) => ({
  id,
  sku,
  name,
  price,
  quantity,
  description,
  category,
  updatedAt: new Date().toISOString(),
});

export const updatePrice = (product, newPrice) => {
  if (newPrice <= 0) {
    throw new Error('Price must be positive');
  }
  return { ...product, price: newPrice, updatedAt: new Date().toISOString() };
};

export const decreaseStock = (product, amount) => {
  const newQuantity = product.quantity - amount;
  if (newQuantity < 0) {
    throw new Error('Insufficient stock');
  }
  return { ...product, quantity: newQuantity, updatedAt: new Date().toISOString() };
};

export const isLowStock = (product, threshold = 10) =>
  product.quantity < threshold;
