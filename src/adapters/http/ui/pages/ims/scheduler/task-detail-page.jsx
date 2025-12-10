
import { h } from 'preact';

export const TaskDetailPage = ({ task, history, error, success }) => {
    return (
        <div class="task-detail-page">
            <div class="page-header">
                <div>
                    <h1 class="m-0">{task.name}</h1>
                    <span class="entity-id block mt-1">{task.id}</span>
                </div>
                <div class="flex gap-2">
                     <form action={`/ims/scheduler/tasks/${task.id}/run`} method="POST" onsubmit="return confirm('Run this task immediately?');">
                        <button type="submit" class="btn btn-primary">
                            Run Now
                        </button>
                    </form>
                </div>
            </div>

            {error && <div class="alert alert-danger mb-4">{error}</div>}
            {success && <div class="alert alert-success mb-4">{success}</div>}

            {/* Metrics Grid */}
            <div class="stat-grid mb-6">
                <div class="stat-card">
                    <h3>Status</h3>
                    <div class={`stat-value ${task.status === 'RUNNING' ? 'text-info' : ''}`}>{task.status}</div>
                    <div class="text-sm text-muted mt-1">{task.enabled ? 'Enabled' : 'Disabled'}</div>
                </div>

                <div class="stat-card">
                    <h3>Last Run</h3>
                    <div class="stat-value text-base">{task.lastRunAt ? new Date(task.lastRunAt).toLocaleString() : 'Never'}</div>
                </div>

                 <div class="stat-card">
                    <h3>Next Run</h3>
                    <div class="stat-value text-base">{task.nextRunAt ? new Date(task.nextRunAt).toLocaleString() : 'Pending'}</div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Settings Card */}
                <div class="lg:col-span-1 space-y-6">
                    <div class="card">
                        <div class="card-header mb-4">
                            <h3 class="card-title m-0">Configuration</h3>
                        </div>
                        <form action={`/ims/scheduler/tasks/${task.id}`} method="POST" class="space-y-4">
                            <div class="form-group">
                                <label class="form-label">Name</label>
                                <input type="text" value={task.name} disabled class="input bg-slate-100 cursor-not-allowed" />
                                <p class="form-hint">Managed by system code.</p>
                            </div>

                             <div class="form-group">
                                <label class="form-label">Handler Key</label>
                                <code class="block w-full p-2 bg-slate-100 rounded text-xs border border-border">{task.handlerKey}</code>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Schedule (Cron)</label>
                                <input type="text" name="cronExpression" value={task.cronExpression} required class="input font-mono" placeholder="* * * * *" />
                                <p class="form-hint">Standard 5-field cron expression.</p>
                            </div>

                            <div class="flex items-center gap-2 pt-2">
                                <input type="checkbox" id="enabled" name="enabled" value="true" checked={task.enabled} class="checkbox" />
                                <label for="enabled" class="text-sm">Enable automated scheduling</label>
                            </div>

                            <div class="pt-4 border-t border-border">
                                <button type="submit" class="btn btn-primary w-full">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* History Card */}
                <div class="lg:col-span-2">
                    <div class="card p-0 h-full">
                        <div class="card-header px-6 py-4 border-b border-border">
                            <h3 class="card-title m-0">Recent Executions</h3>
                        </div>
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Status</th>
                                        <th>Started</th>
                                        <th>Duration</th>
                                        <th>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map(run => {
                                        const duration = run.endTime ? ((new Date(run.endTime) - new Date(run.startTime))/1000).toFixed(1) + 's' : '-';
                                        const badgeClass = run.status === 'SUCCESS' ? 'badge-success' :
                                                           run.status === 'FAILURE' ? 'badge-danger' : 'badge-info';

                                        return (
                                        <tr>
                                            <td>
                                                <span class={`badge ${badgeClass}`}>
                                                    {run.status}
                                                </span>
                                            </td>
                                            <td class="text-muted">
                                                {new Date(run.startTime).toLocaleString()}
                                            </td>
                                            <td>{duration}</td>
                                            <td>
                                                <a href={`/ims/scheduler/history/${run.id}`} class="btn btn-sm btn-secondary">Logs</a>
                                            </td>
                                        </tr>
                                        );
                                    })}
                                    {history.length === 0 && <tr><td colspan="4" class="text-center text-muted p-4">No executions found.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
