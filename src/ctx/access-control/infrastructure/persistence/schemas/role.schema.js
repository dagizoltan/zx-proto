import { z } from 'zod';

export const PermissionSchema = z.object({
    resource: z.string(),
    action: z.string()
});

export const RoleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  permissions: z.array(PermissionSchema).optional()
});
