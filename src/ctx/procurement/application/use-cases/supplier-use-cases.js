import { createSupplier } from '../../domain/entities/supplier.js';

export const createCreateSupplier = ({ supplierRepository }) => {
  const execute = async (tenantId, data) => {
    const supplier = createSupplier({
      ...data,
      id: crypto.randomUUID(),
      tenantId,
    });
    return await supplierRepository.save(tenantId, supplier);
  };

  return { execute };
};

export const createListSuppliers = ({ supplierRepository }) => {
  const execute = async (tenantId, options) => {
    return await supplierRepository.list(tenantId, options);
  };

  return { execute };
};
