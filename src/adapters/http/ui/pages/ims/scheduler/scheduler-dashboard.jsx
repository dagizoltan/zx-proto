
import { h } from 'preact';

export const SchedulerDashboardPage = ({ stats, recentExecutions, activeTasks }) => {
    return (
        <div class="scheduler-dashboard">
            <div class="page-header">
                <h1>Scheduler Dashboard</h1>
                <div class="text-sm text-muted">Last updated: {new Date().toLocaleTimeString()}</div>
            </div>

            {/* Metrics Grid - Uses admin.css .stat-grid */}
            <div class="stat-grid">
                <div class="stat-card">
                    <h3>Success Rate (24h)</h3>
                    <div class={`stat-value ${stats.successRate < 90 ? 'text-error' : ''}`}>{stats.successRate}%</div>
                </div>

                <div class="stat-card">
                    <h3>Avg Runtime</h3>
                    <div class="stat-value">{stats.avgRuntime}</div>
                </div>

                 <div class="stat-card">
                    <h3>Tasks Due Soon</h3>
                    <div class="stat-value">{stats.dueSoonCount}</div>
                </div>

                <div class="stat-card">
                    <h3>Critical Failures</h3>
                    <div class={`stat-value ${stats.criticalFailures > 0 ? 'text-error' : ''}`}>{stats.criticalFailures}</div>
                </div>
            </div>

            {/* Recent Activity & Status - Flex Layout for 2 columns */}
            <div style="display: flex; flex-wrap: wrap; gap: var(--space-6);">
                {/* Recent Executions - Flex Grow to take space */}
                 <div class="card p-0" style="flex: 2; min-width: 300px;">
                    <div class="card-header" style="padding: var(--space-4) var(--space-6); border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0;">Recent Executions</h3>
                        <a href="/ims/scheduler/history" class="btn btn-sm btn-secondary">View All</a>
                    </div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Task</th>
                                    <th>Status</th>
                                    <th>Time</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentExecutions.map(run => {
                                    const badgeClass = run.status === 'SUCCESS' ? 'badge-success' :
                                                       run.status === 'FAILURE' ? 'badge-danger' : 'badge-neutral';

                                    return (
                                    <tr>
                                        <td class="font-medium">{run.taskName}</td>
                                        <td>
                                            <span class={`badge ${badgeClass}`}>
                                                {run.status}
                                            </span>
                                        </td>
                                        <td class="text-sm text-muted">
                                            {new Date(run.startTime).toLocaleString()}
                                        </td>
                                        <td>
                                            <a href={`/ims/scheduler/history/${run.id}`} class="btn btn-sm btn-secondary">View</a>
                                        </td>
                                    </tr>
                                    );
                                })}
                                 {recentExecutions.length === 0 && (
                                     <tr><td colspan="4" class="text-center text-muted">No executions recorded.</td></tr>
                                 )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Task Status Overview */}
                <div class="card" style="flex: 1; min-width: 300px;">
                    <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
                        <h3 style="margin: 0;">Active Tasks</h3>
                        <a href="/ims/scheduler/tasks" class="btn btn-sm btn-secondary">Manage</a>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: var(--space-2);">
                        {activeTasks.map(task => (
                            <div style="display: flex; align-items: center; justify-content: space-between; padding: var(--space-3); background: var(--color-bg-subtle); border-radius: var(--radius-md); border: 1px solid var(--color-border);">
                                <div>
                                    <div style="font-weight: 500;">{task.name}</div>
                                    <div class="text-sm text-muted font-mono">{task.cronExpression}</div>
                                </div>
                                <div class="text-right">
                                    <div class="text-sm text-muted" style="font-size: 0.75rem;">Next: {task.nextRunAt ? new Date(task.nextRunAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Pending'}</div>
                                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: task.enabled ? 'var(--color-success)' : 'var(--color-text-muted)', marginLeft: 'var(--space-2)' }}></span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
