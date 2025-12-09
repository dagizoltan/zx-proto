// Refactored System Context
// Notifications moved to Communication
// Audit moved to Observability

export const createSystemContext = (deps) => {
  // const kvPool = deps.persistence.kvPool;

  // Currently System context primarily holds Users/Roles/Settings which are handled by Access Control or direct handlers
  // If we have specific System settings logic, it goes here.

  // For now, this might be empty or just holding future system-wide config logic.
  // Access Control (Users/Roles) is its own domain `src/ctx/access-control`.

  // The UI routes for Users/Roles were in `system-routes.js` but used handlers from `system.handlers.js`.
  // We need to ensure those handlers don't break if they relied on system context services.
  // Checking handlers... likely they use Access Control services.

  return {
    repositories: {},
    useCases: {}
  };
};
