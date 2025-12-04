export const createProduct = ({ id, sku, name, price, quantity, description, category, status }) => ({
  id,
  sku,
  name,
  price,
  quantity,
  description,
  category,
  status: status || 'ACTIVE',
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
