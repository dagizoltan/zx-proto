import { DomainError } from '../errors/domain-errors.js';

export const createOrder = ({
  id,
  tenantId,
  customerId,
  items,
  totalAmount,
  status = 'CREATED',
  paymentStatus = 'PENDING',
  shippingAddress,
  billingAddress,
  createdAt,
  updatedAt
}) => {
  // Validation
  if (!id) throw new DomainError('Order ID is required', 'INVALID_ORDER_ID');
  if (!customerId) throw new DomainError('Customer ID is required', 'INVALID_CUSTOMER');
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new DomainError('Order must have at least one item', 'INVALID_ITEMS');
  }
  if (totalAmount === undefined || totalAmount < 0) {
    throw new DomainError('Total amount must be non-negative', 'INVALID_AMOUNT');
  }

  // Validate each item
  items.forEach((item, index) => {
    if (!item.productId) {
      throw new DomainError(`Item ${index} missing productId`, 'INVALID_ITEM');
    }
    if (!item.quantity || item.quantity <= 0) {
      throw new DomainError(`Item ${index} has invalid quantity`, 'INVALID_QUANTITY');
    }
    if (item.unitPrice === undefined || item.unitPrice < 0) {
      throw new DomainError(`Item ${index} has invalid price`, 'INVALID_PRICE');
    }
  });

  return Object.freeze({
    id,
    tenantId,
    customerId,
    items,
    totalAmount,
    status,
    paymentStatus,
    shippingAddress,
    billingAddress,
    createdAt: createdAt || new Date().toISOString(),
    updatedAt: updatedAt || new Date().toISOString(),
  });
};
