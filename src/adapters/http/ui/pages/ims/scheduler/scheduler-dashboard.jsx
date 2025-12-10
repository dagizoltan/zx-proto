
import { h } from 'preact';

export const SchedulerDashboardPage = ({ stats, recentExecutions, activeTasks }) => {
    return (
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h1 class="text-2xl font-bold text-slate-800">Scheduler Dashboard</h1>
                <div class="text-sm text-slate-500">Last updated: {new Date().toLocaleTimeString()}</div>
            </div>

            {/* Metrics Grid */}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="stat-card">
                    <div class="stat-title">Success Rate (24h)</div>
                    <div class={`stat-value ${stats.successRate < 90 ? 'text-red-600' : 'text-emerald-600'}`}>{stats.successRate}%</div>
                    <div class="stat-trend text-slate-400">{stats.totalRecent} runs</div>
                </div>

                <div class="stat-card">
                    <div class="stat-title">Avg Runtime</div>
                    <div class="stat-value text-blue-600">{stats.avgRuntime}</div>
                    <div class="stat-trend text-slate-400">per task</div>
                </div>

                 <div class="stat-card">
                    <div class="stat-title">Tasks Due Soon</div>
                    <div class="stat-value text-indigo-600">{stats.dueSoonCount}</div>
                    <div class="stat-trend text-slate-400">Next 24 hours</div>
                </div>

                <div class="stat-card">
                    <div class="stat-title">Critical Failures</div>
                    <div class={`stat-value ${stats.criticalFailures > 0 ? 'text-red-600' : 'text-slate-600'}`}>{stats.criticalFailures}</div>
                    <div class="stat-trend text-slate-400">Last 24 hours</div>
                </div>
            </div>

            {/* Recent Activity & Status */}
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Executions */}
                 <div class="card p-0">
                    <div class="card-header flex justify-between items-center p-4 border-b border-slate-100">
                        <h3 class="card-title font-semibold text-slate-800">Recent Executions</h3>
                        <a href="/ims/scheduler/history" class="text-sm text-indigo-600 hover:text-indigo-800">View All</a>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm text-left">
                            <thead class="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th class="px-4 py-2">Task</th>
                                    <th class="px-4 py-2">Status</th>
                                    <th class="px-4 py-2">Time</th>
                                    <th class="px-4 py-2 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                {recentExecutions.map(run => {
                                    const statusColors = {
                                        'SUCCESS': 'bg-emerald-100 text-emerald-800',
                                        'FAILURE': 'bg-red-100 text-red-800',
                                        'RUNNING': 'bg-blue-100 text-blue-800'
                                    };
                                    const badgeClass = statusColors[run.status] || 'bg-slate-100 text-slate-800';

                                    return (
                                    <tr class="hover:bg-slate-50">
                                        <td class="px-4 py-3 font-medium text-slate-700">{run.taskName}</td>
                                        <td class="px-4 py-3">
                                            <span class={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badgeClass}`}>
                                                {run.status}
                                            </span>
                                        </td>
                                        <td class="px-4 py-3 text-slate-500 text-xs">
                                            {new Date(run.startTime).toLocaleString()}
                                        </td>
                                        <td class="px-4 py-3 text-right">
                                            <a href={`/ims/scheduler/history/${run.id}`} class="text-indigo-600 hover:text-indigo-900">Details</a>
                                        </td>
                                    </tr>
                                    );
                                })}
                                 {recentExecutions.length === 0 && (
                                     <tr><td colspan="4" class="px-4 py-8 text-center text-slate-400">No executions recorded.</td></tr>
                                 )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Task Status Overview */}
                <div class="card">
                    <div class="card-header flex justify-between items-center mb-4">
                        <h3 class="card-title font-semibold text-slate-800">Active Tasks</h3>
                        <a href="/ims/scheduler/tasks" class="text-sm text-indigo-600 hover:text-indigo-800">Manage</a>
                    </div>
                    <div class="space-y-4">
                        {activeTasks.map(task => (
                            <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div>
                                    <div class="font-medium text-slate-700">{task.name}</div>
                                    <div class="text-xs text-slate-500">{task.cronExpression}</div>
                                </div>
                                <div class="text-right">
                                    <div class="text-xs text-slate-500">Next: {task.nextRunAt ? new Date(task.nextRunAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Pending'}</div>
                                    <span class={`inline-block w-2 h-2 rounded-full ${task.enabled ? 'bg-emerald-500' : 'bg-slate-300'} ml-2`}></span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
