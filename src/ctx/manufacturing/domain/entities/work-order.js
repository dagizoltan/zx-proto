export const createWorkOrder = ({
  id,
  tenantId,
  code,
  bomId,
  quantity,
  status = 'PLANNED',
  startDate,
  completionDate,
  assignedTo,
  createdAt,
  updatedAt
}) => {
  if (!id) throw new Error("Work Order ID is required");
  if (!bomId) throw new Error("BOM ID is required");
  if (quantity <= 0) throw new Error("Quantity must be positive");

  return Object.freeze({
    id,
    tenantId,
    code,
    bomId,
    quantity,
    status,
    startDate,
    completionDate,
    assignedTo,
    createdAt: createdAt || new Date().toISOString(),
    updatedAt: updatedAt || new Date().toISOString(),
  });
};
