import { h } from 'preact';

export const AuditLogsPage = ({ user, logs, nextCursor }) => {
  return (
    <div class="audit-logs-page">
      <div class="page-header">
        <h1>Audit Logs</h1>
      </div>

      <div class="card p-0">
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>User</th>
                <th>Action</th>
                <th>Resource</th>
                <th>ID</th>
                <th>IP</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colspan="7" class="text-center p-4">No audit logs found.</td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id}>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td>
                      <div class="text-sm font-medium">{log.userEmail || 'System'}</div>
                      {log.userId && <div class="text-xs text-muted">{log.userId.slice(0,8)}</div>}
                    </td>
                    <td>
                        <span class={`badge badge-neutral`}>{log.action}</span>
                    </td>
                    <td>{log.resource}</td>
                    <td><span class="text-mono text-xs">{log.resourceId ? log.resourceId.slice(0,8) : '-'}</span></td>
                    <td>{log.ip || '-'}</td>
                    <td>
                        {log.details && Object.keys(log.details).length > 0 ? (
                             <details>
                                <summary class="text-xs text-primary cursor-pointer">View JSON</summary>
                                <pre class="text-xs p-2 bg-gray-50 mt-1 rounded overflow-x-auto" style="max-width: 300px;">
                                    {JSON.stringify(log.details, null, 2)}
                                </pre>
                             </details>
                        ) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {nextCursor && (
        <div class="pagination-controls mt-4 flex justify-end">
          <a href={`/ims/system/audit-logs?cursor=${nextCursor}`} class="btn btn-outline">
            Next Page →
          </a>
        </div>
      )}
    </div>
  );
};
