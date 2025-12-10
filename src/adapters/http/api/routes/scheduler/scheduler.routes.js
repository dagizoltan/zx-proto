
import { Hono } from 'hono';
import {
    listTasksHandler,
    updateTaskHandler,
    runTaskHandler,
    listHistoryHandler,
    getDashboardHandler
} from '../../handlers/scheduler/index.js';

export const createSchedulerRoutes = () => {
    const app = new Hono();

    app.get('/tasks', listTasksHandler);
    app.put('/tasks/:id', updateTaskHandler);
    app.post('/tasks/:id/run', runTaskHandler);
    app.get('/history', listHistoryHandler);
    app.get('/dashboard', getDashboardHandler);

    return app;
};
