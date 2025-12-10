
import { h } from 'preact';

export const RunDetailPage = ({ run, task, error, success }) => {
    const duration = run.endTime ? ((new Date(run.endTime) - new Date(run.startTime))/1000).toFixed(2) + 's' : 'Running...';

    return (
        <div class="run-detail-page">
            <div class="page-header">
                <div>
                    <h1 class="m-0">Execution Details</h1>
                    <span class="entity-id block mt-1">{run.id}</span>
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

            {error && <div class="alert alert-danger mb-4">{error}</div>}
            {success && <div class="alert alert-success mb-4">{success}</div>}

            {/* Metrics Grid */}
            <div class="stat-grid mb-6">
                <div class="stat-card">
                    <h3>Status</h3>
                    <div class={`stat-value ${run.status === 'SUCCESS' ? 'text-success' : run.status === 'FAILURE' ? 'text-danger' : 'text-info'}`}>{run.status}</div>
                </div>

                 <div class="stat-card">
                    <h3>Duration</h3>
                    <div class="stat-value">{duration}</div>
                </div>

                <div class="stat-card">
                    <h3>Start Time</h3>
                    <div class="stat-value text-base">{new Date(run.startTime).toLocaleString()}</div>
                </div>

                <div class="stat-card">
                    <h3>Task</h3>
                    <div class="stat-value text-base truncate">
                         {task ? <a href={`/ims/scheduler/tasks/${task.id}`} class="text-primary hover:underline">{task.name}</a> : 'Deleted'}
                    </div>
                    <div class="text-xs text-muted font-mono mt-1">{run.handlerKey}</div>
                </div>
            </div>

             {run.error && (
                <div class="alert alert-danger mb-6">
                    <h3 class="font-bold text-sm uppercase mb-1">Error Message</h3>
                    <div class="font-mono break-words">
                        {run.error}
                    </div>
                </div>
            )}

            <div class="card p-0 flex flex-col h-[600px]">
                <div class="card-header bg-slate-900 border-slate-700 p-4">
                    <h3 class="card-title text-slate-200 text-sm font-mono m-0">Execution Logs</h3>
                </div>
                <div class="flex-1 bg-slate-900 p-4 overflow-x-auto">
                    <pre class="text-xs md:text-sm font-mono leading-relaxed text-slate-300 whitespace-pre-wrap">{run.logs && run.logs.length > 0 ? run.logs.join('\n') : <span class="text-slate-600">No output recorded.</span>}</pre>
                </div>
            </div>
        </div>
    );
};
