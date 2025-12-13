// Pure domain service (no I/O)

export const checkUserPermission = (user, roles, resource, action) => {
  if (!user || !user.roleIds || user.roleIds.length === 0) {
    return false;
  }

  return roles.some(role =>
    role &&
    role.permissions &&
    role.permissions.some(p =>
      p.resource === resource && p.actions.includes(action)
    )
  );
};

export const userHasRole = (user, roles, roleName) => {
  if (!user) return false;
  return roles.some(role => role && role.name === roleName);
};
