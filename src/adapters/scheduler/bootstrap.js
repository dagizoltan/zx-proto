import { createCronAdapter } from '../../adapters/scheduler/cron-adapter.js';
import { createTaskHandlers } from '../../adapters/scheduler/task-handlers.js';

export const bootstrapScheduler = async (ctx) => {
  const schedulerCtx = ctx.get('domain.scheduler');
  const scheduler = schedulerCtx?.services?.scheduler || schedulerCtx?.scheduler || schedulerCtx?.service;
  const obs = ctx.get('domain.observability').obs;

  if (!scheduler) {
    if (obs) await obs.warn('⚠️ Scheduler service not available or invalid. Scheduled tasks disabled.');
    else console.warn('⚠️ Scheduler service not available or invalid. Scheduled tasks disabled.');
    return;
  }

  // Resolve dependencies for handlers
  const handlers = createTaskHandlers({
    inventory: ctx.get('domain.inventory'),
    orders: ctx.get('domain.orders'),
    system: ctx.get('domain.system'),
    catalog: ctx.get('domain.catalog'),
    manufacturing: ctx.get('domain.manufacturing'),
    procurement: ctx.get('domain.procurement'),
    crm: ctx.get('domain.communication'),
    obs: ctx.get('domain.observability').obs
  });

  if (typeof scheduler.registerHandler === 'function') {
      // Register all handlers
      Object.entries(handlers).forEach(([key, handler]) => {
          scheduler.registerHandler(key, handler);
      });

      // Sync definitions (default schedules)
      const TASK_DEFINITIONS = [
          {
              handlerKey: 'system.cleanup_audit_logs',
              name: 'Cleanup Old Audit Logs',
              description: 'Deletes audit logs older than 90 days',
              defaultSchedule: '0 3 * * *' // 3 AM Daily
          },
          {
              handlerKey: 'inventory.snapshot',
              name: 'Daily Inventory Snapshot',
              description: 'Logs total inventory value and item count.',
              defaultSchedule: '55 23 * * *' // 11:55 PM Daily
          },
          {
              handlerKey: 'inventory.check_low_stock',
              name: 'Check Low Stock',
              description: 'Scans for products below threshold and logs warnings.',
              defaultSchedule: '0 * * * *' // Hourly
          },
          {
              handlerKey: 'orders.cancel_stale',
              name: 'Cancel Stale Orders',
              description: 'Cancels unpaid orders older than 48 hours.',
              defaultSchedule: '0 */6 * * *' // Every 6 hours
          },
          {
              handlerKey: 'orders.send_payment_reminders',
              name: 'Send Payment Reminders',
              description: 'Sends emails for unpaid orders older than 24h.',
              defaultSchedule: '0 9 * * *' // 9 AM Daily
          },
          {
              handlerKey: 'catalog.sync_search_index',
              name: 'Sync Search Index',
              description: 'Re-indexes products for search optimization.',
              defaultSchedule: '0 2 * * *' // 2 AM Daily
          },
          {
              handlerKey: 'system.database_backup',
              name: 'Database Backup',
              description: 'Full backup of KV store to external storage.',
              defaultSchedule: '0 4 * * *' // 4 AM Daily
          },
          {
              handlerKey: 'manufacturing.check_overdue_work_orders',
              name: 'Check Overdue Work Orders',
              description: 'Flags work orders past their due date.',
              defaultSchedule: '0 8 * * *' // 8 AM Daily
          },
          {
              handlerKey: 'procurement.check_pending_pos',
              name: 'Check Pending POs',
              description: 'Checks for delayed purchase orders.',
              defaultSchedule: '0 10 * * *' // 10 AM Daily
          },
          {
              handlerKey: 'crm.compute_customer_ltv',
              name: 'Compute Customer LTV',
              description: 'Updates Lifetime Value metrics for customers.',
              defaultSchedule: '0 1 * * 1' // 1 AM Weekly (Monday)
          }
      ];

      await scheduler.syncDefinitions('default', TASK_DEFINITIONS);

      // Start Cron Ticker
      createCronAdapter(scheduler).start();

      if (obs) await obs.info('⏰ Scheduler initialized and started');
      else console.log('⏰ Scheduler initialized and started');
  }
};
