
import { Hono } from 'hono';
import { roleCheckMiddleware } from '../../../api/middleware/rbac-middleware.js'; // Reusing API middleware for RBAC in UI
import {
    schedulerDashboardHandler,
    listTaskDefinitionsHandler,
    listHistoryHandler
} from '../../handlers/scheduler/index.js';

export const schedulerRoutes = new Hono();

// All scheduler routes require admin role
// Note: We might need a UI-specific middleware if the API one expects JSON responses exclusively or behaves differently.
// Typically in this codebase, UI routes use `roleEnrichmentMiddleware` and manual checks or `rbac-middleware` if adapted.
// Let's assume we can use the middleware but if it fails it returns 403 JSON. Ideally UI redirects.
// For now, let's keep it open or check user role inside handler if needed,
// BUT looking at `admin-routes.js`, they use `roleCheckMiddleware` often.
// Wait, `admin-routes.js` was deleted/legacy.
// `system-routes.js` uses `roleCheckMiddleware`.

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
schedulerRoutes.get('/history', listHistoryHandler);
