
import { h } from 'preact';

export const TaskDetailPage = ({ task, history, error, success }) => {
    return (
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-slate-800">{task.name}</h1>
                    <span class="entity-id text-xs text-slate-400 font-mono mt-1 block">{task.id}</span>
                </div>
                <div class="flex gap-2">
                     <form action={`/ims/scheduler/tasks/${task.id}/run`} method="POST" onsubmit="return confirm('Run this task immediately?');">
                        <button type="submit" class="btn btn-primary">
                            Run Now
                        </button>
                    </form>
                </div>
            </div>

            {error && <div class="bg-red-50 text-red-700 p-4 rounded-lg mb-4 border border-red-200">{error}</div>}
            {success && <div class="bg-emerald-50 text-emerald-700 p-4 rounded-lg mb-4 border border-emerald-200">{success}</div>}

            {/* Metrics Grid */}
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="stat-card">
                    <div class="stat-title">Status</div>
                    <div class={`stat-value ${task.status === 'RUNNING' ? 'text-blue-600' : 'text-slate-700'}`}>{task.status}</div>
                    <div class="stat-trend text-slate-400">{task.enabled ? 'Enabled' : 'Disabled'}</div>
                </div>

                <div class="stat-card">
                    <div class="stat-title">Last Run</div>
                    <div class="stat-value text-sm text-slate-700">{task.lastRunAt ? new Date(task.lastRunAt).toLocaleString() : 'Never'}</div>
                    <div class="stat-trend text-slate-400">Previous execution</div>
                </div>

                 <div class="stat-card">
                    <div class="stat-title">Next Run</div>
                    <div class="stat-value text-sm text-slate-700">{task.nextRunAt ? new Date(task.nextRunAt).toLocaleString() : 'Pending'}</div>
                    <div class="stat-trend text-slate-400">Scheduled</div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Settings Card */}
                <div class="lg:col-span-1 space-y-6">
                    <div class="card">
                        <div class="card-header mb-4">
                            <h3 class="card-title font-semibold text-slate-800">Configuration</h3>
                        </div>
                        <form action={`/ims/scheduler/tasks/${task.id}`} method="POST" class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-slate-700 mb-1">Name</label>
                                <input type="text" value={task.name} disabled class="input bg-slate-100 text-slate-500 cursor-not-allowed w-full p-2 border rounded" />
                                <p class="text-xs text-slate-500 mt-1">Managed by system code.</p>
                            </div>

                             <div>
                                <label class="block text-sm font-medium text-slate-700 mb-1">Handler Key</label>
                                <code class="block w-full p-2 bg-slate-100 rounded text-xs text-slate-600 border border-slate-200">{task.handlerKey}</code>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-slate-700 mb-1">Schedule (Cron)</label>
                                <input type="text" name="cronExpression" value={task.cronExpression} required class="input font-mono text-sm w-full p-2 border rounded" placeholder="* * * * *" />
                                <p class="text-xs text-slate-500 mt-1">Standard 5-field cron expression.</p>
                            </div>

                            <div class="flex items-center gap-2 pt-2">
                                <input type="checkbox" id="enabled" name="enabled" value="true" checked={task.enabled} class="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                                <label for="enabled" class="text-sm text-slate-700">Enable automated scheduling</label>
                            </div>

                            <div class="pt-4 border-t border-slate-100">
                                <button type="submit" class="btn btn-primary w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* History Card */}
                <div class="lg:col-span-2">
                    <div class="card h-full">
                        <div class="card-header flex justify-between items-center mb-4">
                            <h3 class="card-title font-semibold text-slate-800">Recent Executions</h3>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="w-full text-sm text-left">
                                <thead class="bg-slate-50 text-slate-500 font-medium">
                                    <tr>
                                        <th class="px-4 py-2">Status</th>
                                        <th class="px-4 py-2">Started</th>
                                        <th class="px-4 py-2">Duration</th>
                                        <th class="px-4 py-2 text-right">Details</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100">
                                    {history.map(run => {
                                        const duration = run.endTime ? ((new Date(run.endTime) - new Date(run.startTime))/1000).toFixed(1) + 's' : '-';
                                        const statusColors = {
                                            'SUCCESS': 'bg-emerald-100 text-emerald-800',
                                            'FAILURE': 'bg-red-100 text-red-800',
                                            'RUNNING': 'bg-blue-100 text-blue-800'
                                        };
                                        const badgeClass = statusColors[run.status] || 'bg-slate-100 text-slate-800';

                                        return (
                                        <tr class="hover:bg-slate-50">
                                            <td class="px-4 py-3">
                                                <span class={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badgeClass}`}>
                                                    {run.status}
                                                </span>
                                            </td>
                                            <td class="px-4 py-3 text-slate-600">
                                                {new Date(run.startTime).toLocaleString()}
                                            </td>
                                            <td class="px-4 py-3 text-slate-500">{duration}</td>
                                            <td class="px-4 py-3 text-right">
                                                <a href={`/ims/scheduler/history/${run.id}`} class="text-indigo-600 hover:text-indigo-900">Logs</a>
                                            </td>
                                        </tr>
                                        );
                                    })}
                                    {history.length === 0 && <tr><td colspan="4" class="px-4 py-8 text-center text-slate-400">No executions found.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
