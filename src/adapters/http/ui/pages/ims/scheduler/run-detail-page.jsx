
import { h } from 'preact';

export const RunDetailPage = ({ run, task, error, success }) => {
    const duration = run.endTime ? ((new Date(run.endTime) - new Date(run.startTime))/1000).toFixed(2) + 's' : 'Running...';

    return (
        <div class="run-detail-page">
            <div class="page-header">
                <div>
                    <h1>Execution Details</h1>
                    <span class="entity-id">{run.id}</span>
                </div>
                 <div class="flex gap-2">
                     {task && (
                     <form action={`/ims/scheduler/history/${run.id}/retry`} method="POST" onsubmit="return confirm('Retry this task? This will create a NEW execution.');">
                        <button type="submit" class="btn btn-secondary">
                            Retry
                        </button>
                    </form>
                     )}
                </div>
            </div>

            {error && <div style="padding: var(--space-4); background: var(--color-error-bg); color: var(--color-error); border-radius: var(--radius-md); margin-bottom: var(--space-4);">{error}</div>}
            {success && <div style="padding: var(--space-4); background: var(--color-success-bg); color: var(--color-success); border-radius: var(--radius-md); margin-bottom: var(--space-4);">{success}</div>}

            {/* Metrics Grid */}
            <div class="stat-grid">
                <div class="stat-card">
                    <h3>Status</h3>
                    <div class="stat-value">
                        <span class={`badge ${run.status === 'SUCCESS' ? 'badge-success' : run.status === 'FAILURE' ? 'badge-danger' : 'badge-neutral'}`} style="font-size: 1.5rem; padding: 0.5rem 1rem;">{run.status}</span>
                    </div>
                </div>

                 <div class="stat-card">
                    <h3>Duration</h3>
                    <div class="stat-value" style="font-size: 1.5rem;">{duration}</div>
                </div>

                <div class="stat-card">
                    <h3>Start Time</h3>
                    <div class="stat-value" style="font-size: 1.25rem;">{new Date(run.startTime).toLocaleString()}</div>
                </div>

                <div class="stat-card">
                    <h3>Task</h3>
                    <div class="stat-value" style="font-size: 1.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                         {task ? <a href={`/ims/scheduler/tasks/${task.id}`}>{task.name}</a> : 'Deleted'}
                    </div>
                    <div class="text-sm text-muted font-mono mt-1">{run.handlerKey}</div>
                </div>
            </div>

             {run.error && (
                <div style="margin-bottom: var(--space-6); padding: var(--space-4); background: var(--color-error-bg); border-radius: var(--radius-md); border: 1px solid var(--color-error);">
                    <h3 style="font-size: var(--font-size-sm); font-weight: 700; text-transform: uppercase; color: var(--color-error); margin-bottom: var(--space-2);">Error Message</h3>
                    <div class="font-mono" style="word-break: break-all; color: var(--color-error);">{run.error}</div>
                </div>
            )}

            <div class="card p-0" style="display: flex; flex-direction: column; height: 600px;">
                <div style="padding: var(--space-3) var(--space-4); background: #1e293b; border-bottom: 1px solid #334155; color: #f1f5f9; border-top-left-radius: var(--radius-lg); border-top-right-radius: var(--radius-lg);">
                    <h3 style="margin: 0; font-size: var(--font-size-sm); font-family: monospace;">Execution Logs</h3>
                </div>
                <div style="flex: 1; padding: var(--space-4); background: #0f172a; overflow: auto; border-bottom-left-radius: var(--radius-lg); border-bottom-right-radius: var(--radius-lg);">
                    <pre style="margin: 0; font-family: monospace; font-size: 0.85rem; line-height: 1.5; color: #e2e8f0; white-space: pre-wrap;">{run.logs && run.logs.length > 0 ? run.logs.join('\n') : <span style="color: #64748b;">No output recorded.</span>}</pre>
                </div>
            </div>
        </div>
    );
};
