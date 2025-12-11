import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';

export const createListProducts = ({ productRepository }) => {
    // Updated to support Cursor Pagination and Filtering
    const execute = async (tenantId, { limit = 20, cursor, status, search, minPrice, maxPrice } = {}) => {
        // If just cursor/limit, use repo.list
        // If filters exist, we need to manual filter (Scan) until we hit limit.
        // repo.list returns { items, nextCursor }.
        // If we filter, we might discard items and need to fetch more.
        // This is complex without a robust Query Engine in Trust Core.
        // For Phase 1, we pull a larger batch and filter in memory, or iterate.
        // Given 'list' in repo.js just iterates 2*limit, let's use that logic but pass 'where' if exact match.

        let where = {};
        if (status) where.status = status;

        const res = await productRepository.list(tenantId, { limit: 1000, cursor, where });
        if (isErr(res)) return res;

        let items = res.value.items;

        // Manual Filtering for non-exact (Range, Search)
        if (search || minPrice !== undefined || maxPrice !== undefined) {
             const lowerQ = search ? search.toLowerCase() : null;
             items = items.filter(p => {
                 if (minPrice !== undefined && p.price < minPrice) return false;
                 if (maxPrice !== undefined && p.price > maxPrice) return false;
                 if (lowerQ) {
                     return p.name.toLowerCase().includes(lowerQ) ||
                            p.description?.toLowerCase().includes(lowerQ) ||
                            p.sku?.toLowerCase().includes(lowerQ);
                 }
                 return true;
             });
        }

        // Slice to limit
        const finalItems = items.slice(0, limit);

        // Next cursor?
        // If we filtered, the repo cursor is for the 1000th item.
        // But we only returning 'limit' items.
        // The UI needs the cursor for the item AFTER the last one we return.
        // But Deno KV cursors are opaque strings representing the key.
        // If we return a cursor from the 1000th item, but show 20, the next page skips 980 items?
        // YES. Cursors must match the scan.
        // This is why filtering on Scan is hard.
        // For now, if we filter, we lose reliable cursor pagination unless we return the cursor of the last item in 'finalItems'.
        // But we can't construct a cursor from an item easily without KV internals.
        //
        // WORKAROUND: For search/filter, disable cursor pagination (return null cursor) or assume small dataset (<1000).
        // For Rebase, assuming <1000 products for search is acceptable.

        return Ok({
            items: finalItems,
            nextCursor: finalItems.length < items.length ? null : res.value.nextCursor // If we filtered out stuff, nextCursor is invalid/hard.
        });
    };
    return { execute };
};

export const createSearchProducts = ({ productRepository }) => {
    const execute = async (tenantId, query) => {
        const res = await productRepository.list(tenantId, { limit: 1000 });
        if (isErr(res)) return res;

        const items = res.value.items;
        const lowerQ = query.toLowerCase();

        return Ok(items.filter(p =>
            p.name.toLowerCase().includes(lowerQ) ||
            p.description?.toLowerCase().includes(lowerQ) ||
            p.sku?.toLowerCase().includes(lowerQ)
        ));
    };
    return { execute };
};

export const createFilterByCategory = ({ productRepository }) => {
    const execute = async (tenantId, categoryId) => {
        const res = await productRepository.queryByIndex(tenantId, 'category', categoryId, { limit: 1000 });
        if (isErr(res)) return res;
        return Ok(res.value.items);
    };
    return { execute };
}
