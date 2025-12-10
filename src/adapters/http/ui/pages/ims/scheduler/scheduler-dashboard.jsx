
import { h } from 'preact';

export const SchedulerDashboardPage = ({ stats, recentExecutions, activeTasks }) => {
    return (
        <div class="scheduler-dashboard">
            <div class="page-header">
                <h1>Scheduler Dashboard</h1>
                <div class="text-sm text-slate-500">Last updated: {new Date().toLocaleTimeString()}</div>
            </div>

            {/* Metrics Grid */}
            <div class="stat-grid">
                <div class="stat-card">
                    <h3>Success Rate (24h)</h3>
                    <div class={`stat-value ${stats.successRate < 90 ? 'text-danger' : 'text-success'}`}>{stats.successRate}%</div>
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
                    <div class={`stat-value ${stats.criticalFailures > 0 ? 'text-danger' : ''}`}>{stats.criticalFailures}</div>
                </div>
            </div>

            {/* Recent Activity & Status */}
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Recent Executions */}
                 <div class="card p-0">
                    <div class="card-header px-6 py-4 border-b border-border">
                        <div class="flex justify-between items-center">
                            <h3 class="m-0">Recent Executions</h3>
                            <a href="/ims/scheduler/history" class="btn btn-sm btn-secondary">View All</a>
                        </div>
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
                                                       run.status === 'FAILURE' ? 'badge-danger' : 'badge-info';

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
                                     <tr><td colspan="4" class="text-center text-muted p-4">No executions recorded.</td></tr>
                                 )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Task Status Overview */}
                <div class="card">
                    <div class="card-header flex justify-between items-center mb-4">
                        <h3 class="card-title m-0">Active Tasks</h3>
                        <a href="/ims/scheduler/tasks" class="btn btn-sm btn-secondary">Manage</a>
                    </div>
                    <div class="space-y-4">
                        {activeTasks.map(task => (
                            <div class="flex items-center justify-between p-3 bg-slate-50 rounded border border-border">
                                <div>
                                    <div class="font-medium">{task.name}</div>
                                    <div class="text-xs text-muted font-mono">{task.cronExpression}</div>
                                </div>
                                <div class="text-right">
                                    <div class="text-xs text-muted">Next: {task.nextRunAt ? new Date(task.nextRunAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Pending'}</div>
                                    <span class={`inline-block w-2 h-2 rounded-full ${task.enabled ? 'bg-success' : 'bg-muted'} ml-2`}></span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
