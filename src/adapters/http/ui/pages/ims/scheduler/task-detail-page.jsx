
import { h } from 'preact';

export const TaskDetailPage = ({ task, history, error, success }) => {
    return (
        <div class="task-detail-page">
            <div class="page-header">
                <div>
                    <h1>{task.name}</h1>
                    <span class="entity-id">{task.id}</span>
                </div>
                <div class="flex gap-2">
                     <form action={`/ims/scheduler/tasks/${task.id}/run`} method="POST" onsubmit="return confirm('Run this task immediately?');">
                        <button type="submit" class="btn btn-primary">
                            Run Now
                        </button>
                    </form>
                </div>
            </div>

            {error && <div style="padding: var(--space-4); background: var(--color-error-bg); color: var(--color-error); border-radius: var(--radius-md); margin-bottom: var(--space-4);">{error}</div>}
            {success && <div style="padding: var(--space-4); background: var(--color-success-bg); color: var(--color-success); border-radius: var(--radius-md); margin-bottom: var(--space-4);">{success}</div>}

            {/* Metrics Grid */}
            <div class="stat-grid">
                <div class="stat-card">
                    <h3>Status</h3>
                    <div class="stat-value">{task.status}</div>
                    <div class="text-sm text-muted" style="margin-top: var(--space-1);">{task.enabled ? 'Enabled' : 'Disabled'}</div>
                </div>

                <div class="stat-card">
                    <h3>Last Run</h3>
                    <div class="stat-value" style="font-size: 1.5rem;">{task.lastRunAt ? new Date(task.lastRunAt).toLocaleString() : 'Never'}</div>
                </div>

                 <div class="stat-card">
                    <h3>Next Run</h3>
                    <div class="stat-value" style="font-size: 1.5rem;">{task.nextRunAt ? new Date(task.nextRunAt).toLocaleString() : 'Pending'}</div>
                </div>
            </div>

            {/* Layout: Settings (1/3) + History (2/3) */}
            <div style="display: flex; flex-wrap: wrap; gap: var(--space-6);">
                <div style="flex: 1; min-width: 300px;">
                    <div class="card">
                        <div style="margin-bottom: var(--space-4); border-bottom: 1px solid var(--color-border); padding-bottom: var(--space-2);">
                            <h3 style="margin: 0;">Configuration</h3>
                        </div>
                        <form action={`/ims/scheduler/tasks/${task.id}`} method="POST">
                            <div style="margin-bottom: var(--space-4);">
                                <label>Name</label>
                                <input type="text" value={task.name} disabled style="background-color: var(--color-bg-subtle); cursor: not-allowed;" />
                                <p class="text-muted text-sm" style="margin-top: var(--space-1);">Managed by system code.</p>
                            </div>

                             <div style="margin-bottom: var(--space-4);">
                                <label>Handler Key</label>
                                <code style="display: block; width: 100%; padding: var(--space-2); background: var(--color-bg-subtle); border-radius: var(--radius-md); border: 1px solid var(--color-border); font-size: var(--font-size-sm);">{task.handlerKey}</code>
                            </div>

                            <div style="margin-bottom: var(--space-4);">
                                <label>Schedule (Cron)</label>
                                <input type="text" name="cronExpression" value={task.cronExpression} required class="font-mono" placeholder="* * * * *" />
                                <p class="text-muted text-sm" style="margin-top: var(--space-1);">Standard 5-field cron expression.</p>
                            </div>

                            <div style="margin-bottom: var(--space-4); display: flex; align-items: center;">
                                <input type="checkbox" id="enabled" name="enabled" value="true" checked={task.enabled} />
                                <label for="enabled" style="margin: 0;">Enable automated scheduling</label>
                            </div>

                            <div style="padding-top: var(--space-4); border-top: 1px solid var(--color-border);">
                                <button type="submit" class="btn btn-primary" style="width: 100%;">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>

                <div style="flex: 2; min-width: 300px;">
                    <div class="card p-0" style="height: 100%; display: flex; flex-direction: column;">
                        <div style="padding: var(--space-4) var(--space-6); border-bottom: 1px solid var(--color-border);">
                            <h3 style="margin: 0;">Recent Executions</h3>
                        </div>
                        <div class="table-container" style="flex: 1;">
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
                                                           run.status === 'FAILURE' ? 'badge-danger' : 'badge-neutral';

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
                                    {history.length === 0 && <tr><td colspan="4" class="text-center text-muted" style="padding: var(--space-4);">No executions found.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
