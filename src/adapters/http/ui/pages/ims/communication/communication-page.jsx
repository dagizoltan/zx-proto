import { h } from 'preact';

const FeedItem = ({ item }) => (
    <div style="padding: var(--space-4); border-bottom: 1px solid var(--color-border); display: flex; gap: var(--space-3);">
        <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-1);">
                {/* FIX: Use channelId as title, fallback to System. Use content as message. */}
                <h6 style="margin: 0; font-size: 1rem; text-transform: capitalize;">{item.channelId || 'System'}</h6>
                <small class="text-muted" style="white-space: nowrap; margin-left: var(--space-2);">
                    {new Date(item.createdAt).toLocaleString()}
                </small>
            </div>
            <p style="margin: 0; color: var(--color-text-muted);">{item.content}</p>
            {item.link && (
                <a href={item.link} class="btn btn-sm btn-secondary" style="margin-top: var(--space-2);">
                    View Details
                </a>
            )}
        </div>
    </div>
);

const MessageItem = ({ msg }) => (
    <div style="padding: var(--space-4); border-bottom: 1px solid var(--color-border);">
        <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-1);">
            <h6 style="margin: 0;">From: {msg.senderId || msg.from}</h6>
            <small class="text-muted">{new Date(msg.createdAt).toLocaleString()}</small>
        </div>
        <p style="margin: 0;">{msg.content}</p>
    </div>
);

const NotificationItem = ({ n }) => {
    // FIX: Normalize level case
    const level = n.level ? n.level.toUpperCase() : 'INFO';
    const colorClass = level === 'ERROR' ? 'text-error' : (level === 'WARN' ? 'text-warning' : 'text-primary');
    // We don't have text-warning class in styles, using inline style fallback or var
    const titleColor = `var(--color-${level === 'INFO' ? 'primary' : level.toLowerCase()})`;

    return (
        <div style="padding: var(--space-4); border-bottom: 1px solid var(--color-border);">
            <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-1);">
                <h6 style={`margin: 0; color: ${titleColor}`}>{n.title}</h6>
                <small class="text-muted">{new Date(n.createdAt).toLocaleString()}</small>
            </div>
            <p style="margin: 0; margin-bottom: var(--space-1);">{n.message}</p>
            {n.link && <a href={n.link} style="font-size: var(--font-size-sm);">View</a>}
        </div>
    );
};

export const CommunicationPage = ({ activeTab, feed, messages, notifications, title }) => {
    return (
        <div class="communication-page">
            <div class="page-header">
                <h1>{title}</h1>
                <div style="font-size: var(--font-size-sm); color: var(--color-text-muted);">
                    <a href="/ims" style="color: var(--color-text-muted);">Home</a> / Communication / {title}
                </div>
            </div>

            <div style="flex: 1; min-width: 0;">
                {activeTab === 'feed' && (
                    <div class="card p-0">
                        <div style="padding: var(--space-4); border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center;">
                            <h2 style="margin: 0; font-size: 1.1rem;">Activity Feed</h2>
                            <a href="/ims/communication/feed/new" class="btn btn-sm btn-primary">New Post</a>
                        </div>
                        <div>
                            {(feed || []).map(item => <FeedItem item={item} />)}
                            {(feed || []).length === 0 && <div style="padding: var(--space-6); text-align: center; color: var(--color-text-muted);">No feed items yet.</div>}
                        </div>
                    </div>
                )}

                {activeTab === 'messages' && (
                     <div class="card p-0">
                        <div style="padding: var(--space-4); border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center;">
                            <h2 style="margin: 0; font-size: 1.1rem;">Messages</h2>
                            <button class="btn btn-sm btn-primary" disabled>Compose</button>
                        </div>
                        <div>
                            {(messages || []).map(msg => <MessageItem msg={msg} />)}
                            {(messages || []).length === 0 && <div style="padding: var(--space-6); text-align: center; color: var(--color-text-muted);">No messages.</div>}
                        </div>
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div class="card p-0">
                        <div style="padding: var(--space-4); border-bottom: 1px solid var(--color-border);">
                            <h2 style="margin: 0; font-size: 1.1rem;">Notifications</h2>
                        </div>
                        <div>
                            {(notifications || []).map(n => <NotificationItem n={n} />)}
                            {(notifications || []).length === 0 && <div style="padding: var(--space-6); text-align: center; color: var(--color-text-muted);">No notifications.</div>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
