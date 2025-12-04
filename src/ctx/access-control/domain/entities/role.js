export const createRole = ({ id, name, permissions = [] }) => ({
  id,
  name,
  permissions, // [{ resource: 'inventory', actions: ['create', 'read'] }]
});
