import { Ok, Err, isErr, unwrap } from '../../../../../lib/trust/index.js';

export const createListAllProducts = ({ productRepository, stockRepository }) => {
  const execute = async (tenantId, { limit = 10, cursor, status, search, categoryId } = {}) => {

    const filter = {};
    if (status) filter.status = status;
    if (categoryId) filter.category = categoryId;
    if (search) filter.search = search;

    const searchFields = ['name', 'sku']; // Inventory view search fields

    // 1. Get Products from Catalog (via Compatibility Repo)
    const productRes = await productRepository.query(tenantId, { limit, cursor, filter, searchFields });
    if (isErr(productRes)) return productRes;

    const { items: products, nextCursor } = productRes.value;

    if (products.length === 0) {
        return Ok({ items: [], nextCursor });
    }

    // 2. Fetch Stock for these products
    // Stock ID is assumed to be the Product ID (1:1 mapping for main stock entry)
    const productIds = products.map(p => p.id);
    const stockRes = await stockRepository.findByIds(tenantId, productIds);

    // stockRes is Result<Array<Stock>>
    // We don't fail if stock fetch fails, we just show 0?
    // Usually if repo fails it's bad. But findByIds returns Ok([]) if none found?
    // Let's assume it returns Ok([found items]).

    const stockMap = new Map();
    if (!isErr(stockRes)) {
        stockRes.value.forEach(s => stockMap.set(s.id, s)); // s.id is productId because Stock ID = Product ID
    }

    // 3. Merge
    const enrichedProducts = products.map(p => {
        const stock = stockMap.get(p.id);
        return {
            ...p,
            quantity: stock ? stock.quantity : 0,
            reservedQuantity: stock ? stock.reserved : 0
            // available is computed in UI or here? UI computes it: (quantity - reserved)
        };
    });

    return Ok({ items: enrichedProducts, nextCursor });
  };

  return { execute };
};
