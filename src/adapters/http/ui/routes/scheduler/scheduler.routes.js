
import { Hono } from 'hono';
import {
    schedulerDashboardHandler,
    listTaskDefinitionsHandler,
    listHistoryHandler,
    taskDetailHandler,
    updateTaskHandler,
    runTaskHandler,
    runDetailHandler,
    retryTaskHandler
} from '../../handlers/scheduler/index.js';

export const schedulerRoutes = new Hono();

// All scheduler routes require admin role
schedulerRoutes.use('*', async (c, next) => {
    // Basic protection
    const user = c.get('user');
    if (!user || !user.roleNames.includes('admin')) {
       return c.text('Unauthorized', 403);
    }
    await next();
});

schedulerRoutes.get('/dashboard', schedulerDashboardHandler);
schedulerRoutes.get('/tasks', listTaskDefinitionsHandler);
schedulerRoutes.get('/tasks/:id', taskDetailHandler);
schedulerRoutes.post('/tasks/:id', updateTaskHandler);
schedulerRoutes.post('/tasks/:id/run', runTaskHandler);

schedulerRoutes.get('/history', listHistoryHandler);
schedulerRoutes.get('/history/:id', runDetailHandler);
schedulerRoutes.post('/history/:id/retry', retryTaskHandler);
