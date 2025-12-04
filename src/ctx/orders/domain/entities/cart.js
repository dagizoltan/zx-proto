export const createCart = (items = []) => ({
  items, // [{ productId, quantity }]
});

export const addItem = (cart, productId, quantity) => {
  const existing = cart.items.find(i => i.productId === productId);
  if (existing) {
    return {
      ...cart,
      items: cart.items.map(i =>
        i.productId === productId
          ? { ...i, quantity: i.quantity + quantity }
          : i
      )
    };
  }
  return {
    ...cart,
    items: [...cart.items, { productId, quantity }]
  };
};

export const removeItem = (cart, productId) => {
    return {
        ...cart,
        items: cart.items.filter(i => i.productId !== productId)
    };
};
