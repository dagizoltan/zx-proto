import { h } from 'preact';

const LogTable = ({ logs }) => {
    if (!logs || logs.length === 0) {
        return <div class="card p-4 text-center text-muted">No logs found.</div>;
    }

    return (
        <div class="card p-0">
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Time</th>
                            <th>Level</th>
                            <th>Message</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map(log => (
                            <tr>
                                <td class="text-nowrap text-secondary" style="font-size: 0.85rem;">
                                    {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td>
                                    <span class={`badge ${getBadgeClass(log.level)}`}>{log.level}</span>
                                </td>
                                <td>{log.message}</td>
                                <td>
                                    <small class="text-muted font-monospace">
                                        {JSON.stringify(log.metadata || {}).slice(0, 50)}...
                                    </small>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const getBadgeClass = (level) => {
    switch (level?.toUpperCase()) {
        case 'ERROR': return 'bg-danger-subtle text-danger';
        case 'WARN': return 'bg-warning-subtle text-warning-emphasis';
        case 'SUCCESS': return 'bg-success-subtle text-success';
        case 'INFO': return 'bg-info-subtle text-info-emphasis';
        case 'ACTIVITY': return 'bg-primary-subtle text-primary';
        case 'AUDIT': return 'bg-dark-subtle text-dark';
        default: return 'bg-secondary-subtle text-secondary';
    }
};

export const LogsPage = ({ title, activeTab, logs, nextCursor }) => {
    return (
        <div class="container-fluid">
            <header class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 class="h3 mb-2 text-gray-800">{title}</h1>
                    <nav aria-label="breadcrumb">
                        <ol class="breadcrumb">
                            <li class="breadcrumb-item"><a href="/ims">Home</a></li>
                            <li class="breadcrumb-item active">{title}</li>
                        </ol>
                    </nav>
                </div>
            </header>

            <div class="mb-4">
                <ul class="nav nav-tabs">
                    <li class="nav-item">
                        <a class={`nav-link ${activeTab === 'logs' ? 'active' : ''}`} href="/ims/observability/logs">
                            System Logs
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class={`nav-link ${activeTab === 'activity' ? 'active' : ''}`} href="/ims/observability/activity">
                            User Activity
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class={`nav-link ${activeTab === 'audit' ? 'active' : ''}`} href="/ims/observability/audit">
                            Audit Trail
                        </a>
                    </li>
                </ul>
            </div>

            <LogTable logs={logs} />

            {nextCursor && (
                <div class="mt-3 text-center">
                    <a href={`?cursor=${nextCursor}`} class="btn btn-outline-primary btn-sm">Load More</a>
                </div>
            )}
        </div>
    );
};
