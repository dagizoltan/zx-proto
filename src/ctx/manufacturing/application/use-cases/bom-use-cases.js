import { createBOM } from '../../domain/entities/bom.js';

export const createCreateBOM = ({ bomRepository }) => {
  const execute = async (tenantId, data) => {
    const bom = createBOM({
      ...data,
      id: crypto.randomUUID(),
      tenantId,
    });
    return await bomRepository.save(tenantId, bom);
  };

  return { execute };
};

export const createListBOMs = ({ bomRepository }) => {
  const execute = async (tenantId, options) => {
    return await bomRepository.list(tenantId, options);
  };

  return { execute };
};
