import { z } from 'zod';

export const listUsersQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  cursor: z.string().optional(),
  q: z.string().optional(),
  search: z.string().optional()
});

export const assignRolesSchema = z.object({
  roleIds: z.array(z.string()).min(1, 'At least one role must be assigned')
});

export const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(50),
  description: z.string().max(200).optional(),
  permissions: z.array(z.string()).optional()
});
