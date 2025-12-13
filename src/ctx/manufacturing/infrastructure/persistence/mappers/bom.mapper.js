import { BOMSchema } from '../schemas/bom.schema.js';
import { createBOM } from '../../../domain/entities/bom.js';
export const bomMapper = {
  toDomain: (dbModel) => { if (!dbModel) return null; return createBOM(dbModel); },
  toPersistence: (domainEntity) => BOMSchema.parse({
        id: domainEntity.id,
        productId: domainEntity.productId,
        name: domainEntity.name,
        version: domainEntity.version,
        components: domainEntity.components,
        laborCost: domainEntity.laborCost,
        instructions: domainEntity.instructions,
        status: domainEntity.status,
        createdAt: domainEntity.createdAt
  }),
  toDomainList: (dbModels) => dbModels.map(bomMapper.toDomain).filter(Boolean),
  toPersistenceList: (domainEntities) => domainEntities.map(bomMapper.toPersistence)
};
