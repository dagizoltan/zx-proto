import { DomainError } from '../errors/domain-errors.js';

export const createRole = ({ id, name, permissions = [] }) => {
  if (!id) throw new DomainError('Role ID is required', 'INVALID_ROLE_ID');
  if (!name || name.trim().length === 0) {
    throw new DomainError('Role name is required', 'INVALID_ROLE_NAME');
  }

  // Validate permissions structure if needed
  if (!Array.isArray(permissions)) {
      throw new DomainError('Permissions must be an array', 'INVALID_PERMISSIONS');
  }

  return Object.freeze({
    id,
    name: name.trim(),
    permissions, // [{ resource: 'inventory', actions: ['create', 'read'] }]
  });
};
