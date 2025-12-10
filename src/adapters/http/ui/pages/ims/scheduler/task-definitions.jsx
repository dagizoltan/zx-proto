
import { h } from 'preact';

export const TaskDefinitionsPage = ({ tasks }) => {
    return (
        <div class="task-definitions-page">
            <div class="page-header">
                <h1>Task Definitions</h1>
            </div>

            <div class="card p-0">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Schedule</th>
                                <th>Status</th>
                                <th>Last Run</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map(task => (
                                <tr>
                                    <td>
                                        <div class="font-medium">{task.name}</div>
                                        <div class="text-xs text-muted">{task.description}</div>
                                    </td>
                                    <td class="font-mono text-sm">{task.cronExpression}</td>
                                    <td>
                                        <span class={`badge ${task.enabled ? 'badge-success' : 'badge-neutral'}`}>
                                            {task.enabled ? 'Enabled' : 'Disabled'}
                                        </span>
                                        {task.status === 'RUNNING' && <span class="badge badge-info ml-2">Running</span>}
                                    </td>
                                    <td class="text-sm text-muted">
                                        {task.lastRunAt ? new Date(task.lastRunAt).toLocaleString() : '-'}
                                    </td>
                                    <td>
                                        <a href={`/ims/scheduler/tasks/${task.id}`} class="btn btn-sm btn-secondary">
                                            Manage
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
