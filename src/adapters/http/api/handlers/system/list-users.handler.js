import { toApiUserList } from '../../transformers/system.transformer.js';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const listUsersHandler = async (c) => {
  const tenantId = c.get('tenantId');
  const ac = c.ctx.get('domain.access-control');

  const query = c.get('validatedQuery');
  const searchTerm = query.q || query.search;

  const result = unwrap(await ac.useCases.listUsers.execute(tenantId, {
      limit: query.limit,
      cursor: query.cursor,
      search: searchTerm
  }));

  return c.json(toApiUserList(result));
};
