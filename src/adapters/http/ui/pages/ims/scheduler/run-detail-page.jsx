
import { h } from 'preact';

export const RunDetailPage = ({ run, task, error, success }) => {
    const duration = run.endTime ? ((new Date(run.endTime) - new Date(run.startTime))/1000).toFixed(2) + 's' : 'Running...';

    return (
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-slate-800">Execution Details</h1>
                    <span class="entity-id text-xs text-slate-400 font-mono mt-1 block">{run.id}</span>
                </div>
                 <div class="flex gap-2">
                     {task && (
                     <form action={`/ims/scheduler/history/${run.id}/retry`} method="POST" onsubmit="return confirm('Retry this task? This will create a NEW execution.');">
                        <button type="submit" class="btn btn-outline border p-2 rounded hover:bg-slate-50">
                            Retry
                        </button>
                    </form>
                     )}
                </div>
            </div>

            {error && <div class="bg-red-50 text-red-700 p-4 rounded-lg mb-4 border border-red-200">{error}</div>}
            {success && <div class="bg-emerald-50 text-emerald-700 p-4 rounded-lg mb-4 border border-emerald-200">{success}</div>}

            {/* Metrics Grid */}
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div class="stat-card">
                    <div class="stat-title">Status</div>
                    <div class={`stat-value ${run.status === 'SUCCESS' ? 'text-emerald-600' : run.status === 'FAILURE' ? 'text-red-600' : 'text-blue-600'}`}>{run.status}</div>
                    <div class="stat-trend text-slate-400">Result</div>
                </div>

                 <div class="stat-card">
                    <div class="stat-title">Duration</div>
                    <div class="stat-value text-slate-700">{duration}</div>
                    <div class="stat-trend text-slate-400">Run time</div>
                </div>

                <div class="stat-card">
                    <div class="stat-title">Start Time</div>
                    <div class="stat-value text-sm text-slate-700">{new Date(run.startTime).toLocaleString()}</div>
                    <div class="stat-trend text-slate-400">Triggered</div>
                </div>

                <div class="stat-card">
                    <div class="stat-title">Task</div>
                    <div class="stat-value text-sm text-indigo-600 truncate">
                         {task ? <a href={`/ims/scheduler/tasks/${task.id}`} class="hover:underline">{task.name}</a> : 'Deleted'}
                    </div>
                    <div class="stat-trend text-slate-400 font-mono text-xs">{run.handlerKey}</div>
                </div>
            </div>

             {run.error && (
                <div class="bg-red-50 border border-red-100 rounded-lg p-4">
                    <h3 class="text-sm font-bold text-red-800 uppercase tracking-wider mb-2">Error Message</h3>
                    <div class="text-sm text-red-700 font-mono break-words">
                        {run.error}
                    </div>
                </div>
            )}

            <div class="card h-full flex flex-col border rounded overflow-hidden">
                <div class="card-header bg-slate-900 border-slate-700 p-3">
                    <h3 class="card-title text-slate-200 text-sm font-mono">Execution Logs</h3>
                </div>
                <div class="flex-1 bg-slate-900 p-4 overflow-x-auto min-h-[500px]">
                    <pre class="text-xs md:text-sm font-mono leading-relaxed text-slate-300 whitespace-pre-wrap">{run.logs && run.logs.length > 0 ? run.logs.join('\n') : <span class="text-slate-600">No output recorded.</span>}</pre>
                </div>
            </div>
        </div>
    );
};
