
import { h } from 'preact';

export const RunDetailPage = ({ run, task, error, success }) => {
    const duration = run.endTime ? ((new Date(run.endTime) - new Date(run.startTime))/1000).toFixed(2) + 's' : 'Running...';

    const statusColors = {
        'SUCCESS': 'bg-emerald-100 text-emerald-800 border-emerald-200',
        'FAILURE': 'bg-red-100 text-red-800 border-red-200',
        'RUNNING': 'bg-blue-100 text-blue-800 border-blue-200'
    };
    const badgeClass = statusColors[run.status] || 'bg-slate-100 text-slate-800 border-slate-200';

    return (
        <div class="max-w-5xl mx-auto space-y-6">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <a href={task ? `/ims/scheduler/tasks/${task.id}` : '/ims/scheduler/history'} class="btn btn-outline btn-sm">
                        &larr; Back
                    </a>
                    <h1 class="text-2xl font-bold text-slate-800">Execution Details</h1>
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

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-1 space-y-6">
                    <div class="card">
                        <div class="card-header mb-4">
                            <h3 class="card-title font-semibold text-slate-800">Meta</h3>
                        </div>
                        <div class="space-y-4">
                            <div>
                                <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</label>
                                <div class="mt-1">
                                    <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium border ${badgeClass}`}>
                                        {run.status}
                                    </span>
                                </div>
                            </div>

                             <div>
                                <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Task</label>
                                <div class="mt-1 font-medium text-slate-700">
                                    {task ? <a href={`/ims/scheduler/tasks/${task.id}`} class="text-indigo-600 hover:underline">{task.name}</a> : 'Deleted Task'}
                                </div>
                                <div class="text-xs text-slate-500 font-mono mt-0.5">{run.handlerKey}</div>
                            </div>

                             <div>
                                <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Duration</label>
                                <div class="mt-1 font-medium text-slate-700">{duration}</div>
                            </div>

                            <div>
                                <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Start Time</label>
                                <div class="mt-1 text-sm text-slate-600">{new Date(run.startTime).toLocaleString()}</div>
                            </div>

                            {run.endTime && (
                            <div>
                                <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">End Time</label>
                                <div class="mt-1 text-sm text-slate-600">{new Date(run.endTime).toLocaleString()}</div>
                            </div>
                            )}

                             {run.error && (
                            <div>
                                <label class="text-xs font-bold text-slate-400 uppercase tracking-wider text-red-500">Error</label>
                                <div class="mt-1 text-sm text-red-600 font-mono bg-red-50 p-2 rounded border border-red-100 break-words">
                                    {run.error}
                                </div>
                            </div>
                            )}
                        </div>
                    </div>
                </div>

                <div class="lg:col-span-2">
                    <div class="card h-full flex flex-col border rounded overflow-hidden">
                        <div class="card-header bg-slate-900 border-slate-700 p-3">
                            <h3 class="card-title text-slate-200 text-sm font-mono">Execution Logs</h3>
                        </div>
                        <div class="flex-1 bg-slate-900 p-4 overflow-x-auto min-h-[400px]">
                            <pre class="text-xs md:text-sm font-mono leading-relaxed text-slate-300 whitespace-pre-wrap">{run.logs && run.logs.length > 0 ? run.logs.join('\n') : <span class="text-slate-600">No output recorded.</span>}</pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
