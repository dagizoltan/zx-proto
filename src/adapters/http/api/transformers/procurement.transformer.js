/**
 * Procurement Transformers
 */

export const toApiSupplier = (s) => ({
    id: s.id,
    name: s.name,
    contactName: s.contactName,
    email: s.email,
    phone: s.phone,
    address: s.address
});

export const toApiPO = (po) => ({
    id: po.id,
    supplierId: po.supplierId,
    items: po.items,
    status: po.status,
    totalAmount: po.totalAmount,
    createdAt: po.createdAt,
    expectedDate: po.expectedDate
});
