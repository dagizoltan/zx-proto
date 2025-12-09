/**
 * Manufacturing Transformers
 */

export const toApiBOM = (bom) => ({
    id: bom.id,
    productId: bom.productId,
    name: bom.name,
    components: bom.components,
    createdAt: bom.createdAt
});

export const toApiWorkOrder = (wo) => ({
    id: wo.id,
    bomId: wo.bomId,
    status: wo.status,
    quantity: wo.quantity,
    producedQuantity: wo.producedQuantity,
    startDate: wo.startDate,
    dueDate: wo.dueDate,
    priority: wo.priority
});
