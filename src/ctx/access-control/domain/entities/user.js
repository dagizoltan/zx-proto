import { DomainError } from '../errors/domain-errors.js';

export const createUser = ({ id, email, passwordHash, name, roleIds = [] }) => {
  if (!id) throw new DomainError('User ID is required', 'INVALID_USER_ID');
  if (!email) throw new DomainError('Email is required', 'INVALID_EMAIL');
  // Basic email validation regex
  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    throw new DomainError('Invalid email format', 'INVALID_EMAIL_FORMAT');
  }
  if (!passwordHash) throw new DomainError('Password hash is required', 'INVALID_PASSWORD');
  if (!name || name.trim().length === 0) {
    throw new DomainError('Name is required', 'INVALID_NAME');
  }

  return Object.freeze({
    id,
    email: email.toLowerCase(),
    passwordHash,
    name: name.trim(),
    roleIds,
    createdAt: new Date().toISOString(),
  });
};
