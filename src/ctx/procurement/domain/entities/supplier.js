export const createSupplier = ({
  id,
  tenantId,
  name,
  code,
  contactName,
  email,
  phone,
  address,
  currency = 'USD',
  paymentTerms,
  status = 'ACTIVE',
  createdAt,
  updatedAt
}) => {
  if (!id) throw new Error("Supplier ID is required");
  if (!name) throw new Error("Supplier Name is required");
  if (!code) throw new Error("Supplier Code is required");

  return Object.freeze({
    id,
    tenantId,
    name,
    code,
    contactName,
    email,
    phone,
    address,
    currency,
    paymentTerms,
    status,
    createdAt: createdAt || new Date().toISOString(),
    updatedAt: updatedAt || new Date().toISOString(),
  });
};
