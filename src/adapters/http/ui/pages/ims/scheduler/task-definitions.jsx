
import { h } from 'preact';

export const TaskDefinitionsPage = ({ tasks }) => {
    return (
        <div class="space-y-6">
            <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Task Definitions</h1>

            <div class="card p-0">
                <table class="w-full text-left">
                    <thead class="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th class="p-4">Name</th>
                            <th class="p-4">Schedule (Cron)</th>
                            <th class="p-4">Status</th>
                            <th class="p-4">Last Run</th>
                            <th class="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                        {tasks.map(task => (
                            <tr key={task.id} class="hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                                <td class="p-4">
                                    <div class="font-medium text-gray-900 dark:text-gray-100">{task.name}</div>
                                    <div class="text-xs text-gray-500">{task.description}</div>
                                </td>
                                <td class="p-4 font-mono text-sm">{task.cronExpression}</td>
                                <td class="p-4">
                                    <span class={`badge ${task.enabled ? 'badge-success' : 'badge-neutral'}`}>
                                        {task.enabled ? 'Enabled' : 'Disabled'}
                                    </span>
                                    {task.status === 'RUNNING' && <span class="badge badge-info ml-2">Running</span>}
                                </td>
                                <td class="p-4 text-sm text-gray-500">
                                    {task.lastRunAt ? new Date(task.lastRunAt).toLocaleString() : '-'}
                                </td>
                                <td class="p-4 text-right space-x-2">
                                    <a href={`/ims/scheduler/tasks/${task.id}`} class="btn btn-sm btn-ghost text-indigo-600">
                                        Manage
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
