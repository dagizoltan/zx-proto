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

export const LogsPage = ({ title, activeTab, logs, nextCursor }) => {
    return (
        <div class="logs-page">
            <div class="page-header">
                <h1>{title}</h1>
                <div style="font-size: var(--font-size-sm); color: var(--color-text-muted);">
                    <a href="/ims" style="color: var(--color-text-muted);">Home</a> / Observability / {title}
                </div>
            </div>

            {/* Removed Tabs. Rendering only the active content. */}

            <LogTable logs={logs} />

            {nextCursor && (
                <div class="text-center mt-4">
                    <a href={`?cursor=${nextCursor}`} class="btn btn-secondary">Load More</a>
                </div>
            )}
        </div>
    );
};
