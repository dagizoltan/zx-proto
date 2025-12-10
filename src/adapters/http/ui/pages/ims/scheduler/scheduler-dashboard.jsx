
import { h } from 'preact';

export const SchedulerDashboardPage = ({ stats }) => {
    return (
        <div class="space-y-6">
            <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Scheduler Dashboard</h1>

            <div class="stat-grid">
                <div class="stat-card">
                    <div class="stat-value">{stats.totalTasks}</div>
                    <div class="stat-label">Total Tasks</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value text-green-600">{stats.activeTasks}</div>
                    <div class="stat-label">Active Tasks</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value text-red-600">{stats.failingTasks}</div>
                    <div class="stat-label">Failing Tasks</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value text-sm">{stats.lastRun ? new Date(stats.lastRun).toLocaleString() : 'Never'}</div>
                    <div class="stat-label">Last Execution</div>
                </div>
            </div>
        </div>
    );
};
