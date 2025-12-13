export const IShipmentRepository = {
  save: (tenantId, shipment) => {
    throw new Error('Port method must be implemented');
  },

  findById: (tenantId, id) => {
    throw new Error('Port method must be implemented');
  },

  queryByIndex: (tenantId, indexName, value, options) => {
    throw new Error('Port method must be implemented');
  },

  list: (tenantId, options) => {
    throw new Error('Port method must be implemented');
  }
};
