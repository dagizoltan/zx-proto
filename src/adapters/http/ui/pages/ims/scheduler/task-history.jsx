
import { h } from 'preact';

export const TaskHistoryPage = ({ history, tasks }) => {
    // Helper to get task name
    const getTaskName = (id) => {
        const t = tasks.find(x => x.id === id);
        return t ? t.name : id;
    };

    return (
        <div class="space-y-6">
            <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Task Execution History</h1>

            <div class="card p-0">
                <table class="w-full text-left">
                    <thead class="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th class="p-4">Task</th>
                            <th class="p-4">Started At</th>
                            <th class="p-4">Duration</th>
                            <th class="p-4">Status</th>
                            <th class="p-4">Logs</th>
                            <th class="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                        {history.map(exec => (
                            <tr key={exec.id} class="hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                                <td class="p-4 font-medium">{getTaskName(exec.taskId)}</td>
                                <td class="p-4 text-sm">{new Date(exec.startTime).toLocaleString()}</td>
                                <td class="p-4 text-sm">
                                    {exec.endTime ? `${(new Date(exec.endTime) - new Date(exec.startTime)) / 1000}s` : '...'}
                                </td>
                                <td class="p-4">
                                    <span class={`badge ${
                                        exec.status === 'SUCCESS' ? 'badge-success' :
                                        exec.status === 'FAILED' ? 'badge-error' : 'badge-info'
                                    }`}>
                                        {exec.status}
                                    </span>
                                </td>
                                <td class="p-4 text-xs font-mono max-w-md truncate">
                                    {exec.error ? <span class="text-red-500">{exec.error}</span> : exec.logs[exec.logs.length - 1]}
                                </td>
                                <td class="p-4">
                                    <a href={`/ims/scheduler/history/${exec.id}`} class="text-primary-600 hover:text-primary-900 font-medium text-sm">View</a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
