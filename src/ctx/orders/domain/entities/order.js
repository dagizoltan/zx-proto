export const createOrder = ({ id, userId, items, status = 'pending', total }) => ({
  id,
  userId,
  items, // [{ productId, quantity, price }]
  status,
  total,
  createdAt: new Date().toISOString(),
});
