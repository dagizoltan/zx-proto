/**
 * Order Transformers
 */

export const toApiOrder = (order) => {
    return {
      id: order.id,
      userId: order.userId,
      items: order.items,
      totalAmount: order.totalAmount,
      status: order.status,
      notes: order.notes,
      shippingAddress: order.shippingAddress,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };
  };

  export const toApiOrderList = (result) => {
    return {
      items: result.items.map(toApiOrder),
      nextCursor: result.nextCursor,
      total: result.total // if available
    };
  };
