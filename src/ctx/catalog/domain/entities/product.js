export const createProduct = ({
  id,
  sku,
  name,
  description,
  categoryId,
  price,
  priceRules = [],
  type = 'SIMPLE',
  parentId,
  variantAttributes,
  configurableAttributes,
  status = 'ACTIVE',
  createdAt,
  updatedAt
}) => {
  if (!id) throw new Error('Product ID is required');
  if (!sku) throw new Error('Product SKU is required');
  if (!name) throw new Error('Product Name is required');
  if (price === undefined || price <= 0) throw new Error('Product Price must be positive');

  if (type === 'VARIANT' && !parentId) {
    throw new Error('Variant products must have a parent');
  }

  return Object.freeze({
    id,
    sku,
    name,
    description,
    categoryId,
    price,
    priceRules,
    type,
    parentId,
    variantAttributes,
    configurableAttributes,
    status,
    createdAt: createdAt || new Date().toISOString(),
    updatedAt: updatedAt || new Date().toISOString(),
  });
};
