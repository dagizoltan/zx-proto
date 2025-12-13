export const createPriceList = ({ id, name, currency = 'USD', prices = [] }) => {
  if (!id) throw new Error('PriceList ID is required');
  if (!name) throw new Error('PriceList Name is required');

  return Object.freeze({
    id,
    name,
    currency,
    prices
  });
};
