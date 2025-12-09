import { h } from 'preact';

export const NotificationsPage = ({ user, notifications, nextCursor }) => {
  return (
    <div class="notifications-page">
      <div class="page-header">
        <h1>Notifications</h1>
      </div>

      <div class="card p-0">
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Level</th>
                <th>Title</th>
                <th>Message</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {notifications.length === 0 ? (
                <tr>
                  <td colspan="5" class="text-center p-4">No notifications found.</td>
                </tr>
              ) : (
                notifications.map(n => (
                  <tr key={n.id} class={!n.read ? 'font-bold' : ''}>
                    <td>
                      <span class={`badge badge-${n.level === 'ERROR' ? 'danger' : n.level.toLowerCase()}`}>
                        {n.level}
                      </span>
                    </td>
                    <td>{n.title}</td>
                    <td>{n.message}</td>
                    <td>{new Date(n.createdAt).toLocaleString()}</td>
                    <td>
                      {n.read ? (
                        <span class="text-muted">Read</span>
                      ) : (
                        <span class="text-primary">New</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination would go here */}
    </div>
  );
};
