export const createBOM = ({
  id,
  tenantId,
  productId,
  name,
  version = '1.0',
  components = [],
  laborCost = 0,
  instructions,
  status = 'DRAFT',
  createdAt,
  updatedAt
}) => {
  if (!id) throw new Error("BOM ID is required");
  if (!productId) throw new Error("Product ID is required");
  if (!name) throw new Error("BOM Name is required");
  if (!components || components.length === 0) throw new Error("BOM must have at least one component");

  return Object.freeze({
    id,
    tenantId,
    productId,
    name,
    version,
    components, // [{ productId, quantity, notes, unit }]
    laborCost,
    instructions,
    status,
    createdAt: createdAt || new Date().toISOString(),
    updatedAt: updatedAt || new Date().toISOString(),
  });
};
