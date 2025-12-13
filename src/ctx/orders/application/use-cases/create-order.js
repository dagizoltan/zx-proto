import { createOrder } from '../../domain/entities/order.js';
import { DomainError } from '../../domain/errors/domain-errors.js';
import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';

export const createCreateOrder = ({
  orderRepository,
  catalogGateway,
  inventoryGateway,
  customerGateway,
  obs,
  eventBus
}) => {
  const execute = async (tenantId, userId, items) => {
    try {
      // 1. Validate Customer Exists
      const customerRes = await customerGateway.getCustomer(tenantId, userId);
      if (isErr(customerRes)) {
        return Err({
          code: 'INVALID_CUSTOMER',
          message: 'Customer not found or invalid'
        });
      }

      // 2. Fetch Product Information
      const productIds = [...new Set(items.map(item => item.productId))];
      const productsRes = await catalogGateway.getProducts(tenantId, productIds);
      if (isErr(productsRes)) return productsRes;

      const products = productsRes.value;
      const productMap = new Map(products.map(p => [p.id, p]));

      // 3. Validate All Products Exist
      for (const item of items) {
        if (!productMap.has(item.productId)) {
          return Err({
            code: 'PRODUCT_NOT_FOUND',
            message: `Product ${item.productId} not found`
          });
        }
      }

      // 4. Calculate Total and Enrich Items
      let calculatedTotal = 0;
      const enrichedItems = items.map(item => {
        const product = productMap.get(item.productId);
        const itemTotal = product.price * item.quantity;
        calculatedTotal += itemTotal;

        return {
          productId: product.id,
          quantity: item.quantity,
          unitPrice: product.price,
          totalPrice: itemTotal,
          productName: product.name
        };
      });

      // 5. Create Order Entity
      const orderId = crypto.randomUUID();
      const order = createOrder({
        id: orderId,
        customerId: userId,
        tenantId,
        items: enrichedItems,
        totalAmount: calculatedTotal,
        status: 'CREATED'
      });

      // 6. Reserve Stock
      const stockItems = items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }));

      const reserveRes = await inventoryGateway.reserveStock(
        tenantId,
        stockItems,
        order.id
      );

      if (isErr(reserveRes)) {
        return reserveRes; // Propagate stock error (e.g., Insufficient Stock)
      }

      // 7. Save Order
      const saveRes = await orderRepository.save(tenantId, order);

      if (isErr(saveRes)) {
        // Rollback: Release stock reservation
        obs?.error('Order save failed, releasing stock', {
          orderId: order.id,
          error: saveRes.error
        });

        await inventoryGateway.releaseStock(tenantId, order.id).catch(err => {
          obs?.error('CRITICAL: Failed to release stock after order save failure', {
            orderId: order.id,
            error: err
          });
        });

        return saveRes;
      }

      // 8. Publish Event
      if (eventBus) {
        await eventBus.publish('order.created', { ...order, tenantId });
      }

      // 9. Audit Log
      if (obs) {
        await obs.audit('Order created', {
          orderId: order.id,
          userId,
          totalAmount: order.totalAmount,
          tenantId
        });
      }

      return Ok(order);

    } catch (error) {
      if (error instanceof DomainError) {
        return Err({ code: error.code, message: error.message });
      }
      return Err({ code: 'CREATE_ORDER_ERROR', message: error.message });
    }
  };

  return { execute };
};
