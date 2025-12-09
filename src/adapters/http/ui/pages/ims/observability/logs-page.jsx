import { h } from 'preact';

const LogTable = ({ logs }) => {
    if (!logs || logs.length === 0) {
        return <div class="card p-6 text-center text-muted">No logs found.</div>;
    }

    return (
        <div class="card p-0">
            <div class="table-container">
                <table>
                    <thead>
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
                                <td style="white-space: nowrap; color: var(--color-text-muted); font-size: 0.85rem;">
                                    {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td>
                                    <span class={`badge ${getBadgeClass(log.level)}`}>{log.level}</span>
                                </td>
                                <td>{log.message}</td>
                                <td>
                                    <div style="font-family: monospace; font-size: 0.85em; color: var(--color-text-muted); max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                        {JSON.stringify(log.metadata || {})}
                                    </div>
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
        case 'ERROR': return 'badge-error';
        case 'WARN': return 'badge-warning';
        case 'SUCCESS': return 'badge-success';
        case 'INFO': return 'badge-primary'; // Map info to primary/blue
        case 'ACTIVITY': return 'badge-neutral';
        case 'AUDIT': return 'badge-neutral'; // Dark/Neutral
        default: return 'badge-neutral';
    }
};

const Tabs = ({ activeTab }) => {
    const tabs = [
        { id: 'logs', label: 'System Logs', href: '/ims/observability/logs' },
        { id: 'activity', label: 'User Activity', href: '/ims/observability/activity' },
        { id: 'audit', label: 'Audit Trail', href: '/ims/observability/audit' }
    ];

    return (
        <div style="margin-bottom: var(--space-6); border-bottom: 1px solid var(--color-border); display: flex; gap: var(--space-4);">
            {tabs.map(tab => (
                <a
                    href={tab.href}
                    style={`
                        padding: var(--space-2) 0;
                        border-bottom: 2px solid ${activeTab === tab.id ? 'var(--color-primary)' : 'transparent'};
                        color: ${activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-muted)'};
                        font-weight: 500;
                        text-decoration: none;
                    `}
                >
                    {tab.label}
                </a>
            ))}
        </div>
    );
};

export const LogsPage = ({ title, activeTab, logs, nextCursor }) => {
    return (
        <div class="logs-page">
            <div class="page-header">
                <h1>{title}</h1>
                <div style="font-size: var(--font-size-sm); color: var(--color-text-muted);">
                    <a href="/ims" style="color: var(--color-text-muted);">Home</a> / {title}
                </div>
            </div>

            <Tabs activeTab={activeTab} />

            <LogTable logs={logs} />

            {nextCursor && (
                <div class="text-center mt-4">
                    <a href={`?cursor=${nextCursor}`} class="btn btn-secondary">Load More</a>
                </div>
            )}
        </div>
    );
};
