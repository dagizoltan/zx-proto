import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid().or(z.string().min(1)),
  email: z.string().email(),
  passwordHash: z.string().min(1),
  name: z.string().min(1),
  roleIds: z.array(z.string()),
  createdAt: z.string().optional()
});

export const PermissionSchema = z.object({
    resource: z.string(),
    action: z.string()
});

export const RoleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  permissions: z.array(PermissionSchema).optional()
});
