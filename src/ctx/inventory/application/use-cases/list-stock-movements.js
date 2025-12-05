export const createListStockMovements = ({ stockMovementRepository }) => {
  const execute = async (tenantId, productId, { limit = 20, cursor } = {}) => {
    const result = await stockMovementRepository.getByProduct(tenantId, productId, { limit, cursor });

    // Fix: In-memory sort by timestamp descending because KV keys are UUIDs (not time-sorted)
    // and we cannot easily change key structure in this patch.
    // Note: Pagination with in-memory sort is imperfect if not all items are fetched,
    // but stock movement history per product is usually manageable.
    // If list is huge, this only sorts the *fetched page*. Ideally we need Time-ULIDs.

    if (result.items && result.items.length > 0) {
        result.items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    return result;
  };
  return { execute };
};
