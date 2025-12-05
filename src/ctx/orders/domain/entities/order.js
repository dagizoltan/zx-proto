export const createOrder = ({ id, userId, items, status = 'pending', total, createdAt }) => ({
  id,
  userId,
  items, // [{ productId, quantity, price }]
  status,
  total,
  createdAt: createdAt || new Date().toISOString(),
});
