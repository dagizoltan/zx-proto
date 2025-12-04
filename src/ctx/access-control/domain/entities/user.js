export const createUser = ({ id, email, passwordHash, name, roleIds = [] }) => ({
  id,
  email,
  passwordHash,
  name,
  roleIds,
  createdAt: new Date().toISOString(),
});
