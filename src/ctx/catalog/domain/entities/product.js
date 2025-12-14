import { Ok, Err } from '../../../../../lib/trust/index.js';

export const createProduct = ({
  id,
  sku,
  name,
  description,
  categoryId,
  price,
  priceRules = [],
  type = 'SIMPLE',
  parentId,
  variantAttributes,
  configurableAttributes,
  status = 'ACTIVE',
  createdAt,
  updatedAt
}) => {
  if (!id) throw new Error('Product ID is required');
  if (!sku) throw new Error('Product SKU is required');
  if (!name) throw new Error('Product Name is required');
  // Price can be 0 (free sample?) but let's keep >0 check if that's business rule.
  // Previous code said <= 0 throw.
  if (price === undefined || price < 0) throw new Error('Product Price cannot be negative');

  if (type === 'VARIANT' && !parentId) {
    throw new Error('Variant products must have a parent');
  }

  return Object.freeze({
    id,
    sku,
    name,
    description,
    categoryId,
    price,
    priceRules,
    type,
    parentId,
    variantAttributes,
    configurableAttributes,
    status,
    createdAt: createdAt || new Date().toISOString(),
    updatedAt: updatedAt || new Date().toISOString(),
  });
};

/**
 * Validates if a variant is compatible with its parent.
 * Pure Domain Logic.
 *
 * @param {Object} variant - The variant product
 * @param {Object} parent - The parent product
 * @returns {Result<boolean, Error>}
 */
export const validateVariantAgainstParent = (variant, parent) => {
    if (variant.type !== 'VARIANT') return Ok(true); // Not a variant, no check needed

    if (variant.parentId !== parent.id) {
        return Err({ code: 'VALIDATION_ERROR', message: `Variant parentId ${variant.parentId} does not match parent ${parent.id}` });
    }

    if (parent.type !== 'CONFIGURABLE') {
        return Err({ code: 'VALIDATION_ERROR', message: 'Parent product must be CONFIGURABLE' });
    }

    const requiredAttrs = parent.configurableAttributes || [];
    const variantAttrs = variant.variantAttributes || {};

    for (const attr of requiredAttrs) {
        if (!variantAttrs[attr]) {
            return Err({ code: 'VALIDATION_ERROR', message: `Variant is missing required attribute: ${attr}` });
        }
    }

    return Ok(true);
};
