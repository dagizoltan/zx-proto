
export const createSystemEventsListener = ({ notificationService, eventBus }) => {

    // Map Domain Events to Human Readable Notifications
    const setupSubscriptions = () => {

        // --- Catalog ---
        eventBus.subscribe('catalog.product_created', async (payload) => {
            await notificationService.notify(payload.tenantId, {
                level: 'SUCCESS',
                title: 'Product Created',
                message: `Successfully created product "${payload.name || payload.id}".`,
                link: `/ims/catalog/products/${payload.id}`
            });
        });

        eventBus.subscribe('catalog.category_created', async (payload) => {
             await notificationService.notify(payload.tenantId, {
                 level: 'SUCCESS',
                 title: 'Category Created',
                 message: `Successfully created category "${payload.name}".`,
                 link: `/ims/catalog/products?category=${payload.id}`
             });
        });

        eventBus.subscribe('catalog.pricelist_created', async (payload) => {
             await notificationService.notify(payload.tenantId, {
                 level: 'SUCCESS',
                 title: 'Price List Created',
                 message: `Successfully created price list "${payload.name}".`,
                 link: `/ims/catalog/pricelists/${payload.id}`
             });
        });


        // --- Inventory ---
        eventBus.subscribe('inventory.stock_received', async (payload) => {
             await notificationService.notify(payload.tenantId, {
                 level: 'SUCCESS',
                 title: 'Stock Received',
                 message: `Received ${payload.quantity} units of product ${payload.productId.slice(0,8)}.`,
                 link: `/ims/inventory/stock`
             });
        });

        // --- Procurement ---
        eventBus.subscribe('procurement.supplier_created', async (payload) => {
             await notificationService.notify(payload.tenantId, {
                 level: 'SUCCESS',
                 title: 'Supplier Created',
                 message: `Successfully created supplier "${payload.name}".`,
                 link: `/ims/procurement/suppliers/${payload.id}`
             });
        });

        eventBus.subscribe('procurement.po_created', async (payload) => {
             await notificationService.notify(payload.tenantId, {
                 level: 'SUCCESS',
                 title: 'Purchase Order Created',
                 message: `Successfully created PO #${payload.code}.`,
                 link: `/ims/procurement/purchase-orders/${payload.id}`
             });
        });

        // --- Manufacturing ---
        eventBus.subscribe('manufacturing.bom_created', async (payload) => {
             await notificationService.notify(payload.tenantId, {
                 level: 'SUCCESS',
                 title: 'BOM Created',
                 message: `Successfully created BOM "${payload.name || payload.id}".`,
                 link: `/ims/manufacturing/boms/${payload.id}`
             });
        });

        eventBus.subscribe('manufacturing.wo_created', async (payload) => {
             await notificationService.notify(payload.tenantId, {
                 level: 'SUCCESS',
                 title: 'Work Order Created',
                 message: `Successfully created Work Order #${payload.code}.`,
                 link: `/ims/manufacturing/work-orders/${payload.id}`
             });
        });

        eventBus.subscribe('manufacturing.wo_completed', async (payload) => {
             await notificationService.notify(payload.tenantId, {
                 level: 'SUCCESS',
                 title: 'Work Order Completed',
                 message: `Work Order #${payload.code} has been completed.`,
                 link: `/ims/manufacturing/work-orders/${payload.id}`
             });
        });

        // --- Access Control ---
        eventBus.subscribe('access_control.user_registered', async (payload) => {
             await notificationService.notify(payload.tenantId, {
                 level: 'SUCCESS',
                 title: 'User Registered',
                 message: `Successfully registered user "${payload.name}" (${payload.email}).`,
                 link: `/ims/system/users/${payload.id}`
             });
        });

        eventBus.subscribe('access_control.role_created', async (payload) => {
             await notificationService.notify(payload.tenantId, {
                 level: 'SUCCESS',
                 title: 'Role Created',
                 message: `Successfully created role "${payload.name}".`,
                 link: `/ims/system/roles/${payload.id}`
             });
        });

        // --- Inventory Structure ---
        eventBus.subscribe('inventory.warehouse_created', async (payload) => {
             await notificationService.notify(payload.tenantId, {
                 level: 'SUCCESS',
                 title: 'Warehouse Created',
                 message: `Successfully created warehouse "${payload.name}".`,
                 link: `/ims/inventory/warehouses/${payload.id}`
             });
        });

        eventBus.subscribe('inventory.location_created', async (payload) => {
             await notificationService.notify(payload.tenantId, {
                 level: 'SUCCESS',
                 title: 'Location Created',
                 message: `Successfully created location "${payload.name}".`,
                 link: `/ims/inventory/locations/${payload.id}`
             });
        });

        // --- Orders ---
        eventBus.subscribe('order.created', async (payload) => {
             await notificationService.notify(payload.tenantId, {
                 level: 'INFO',
                 title: 'New Order',
                 message: `Order #${payload.id.slice(0,8)} created. Total: $${payload.total}`,
                 link: `/ims/orders/${payload.id}`
             });
        });
    };

    return { setupSubscriptions };
};
