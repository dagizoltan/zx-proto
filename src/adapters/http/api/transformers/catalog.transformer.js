/**
 * Catalog Transformers
 * Format product data for API responses
 */

export const toApiProduct = (product) => {
    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      description: product.description,
      price: product.price,
      quantity: product.quantity,
      status: product.status,
      category: product.category,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    };
  };

  export const toApiProductList = (result) => {
    return {
      items: result.items.map(toApiProduct),
      nextCursor: result.nextCursor,
      total: result.total // if available
    };
  };

  export const toApiCategory = (category) => {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      parentId: category.parentId,
      active: category.active,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    };
  };
