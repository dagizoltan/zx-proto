export const createCategory = ({ id, name, parentId, description }) => {
  if (!id) throw new Error('Category ID is required');
  if (!name) throw new Error('Category Name is required');

  return Object.freeze({
    id,
    name,
    parentId,
    description
  });
};
