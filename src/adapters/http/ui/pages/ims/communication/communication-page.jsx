import { h } from 'preact';

const FeedItem = ({ item }) => (
    <div style="padding: var(--space-4); border-bottom: 1px solid var(--color-border); display: flex; gap: var(--space-3);">
        <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-1);">
                <h6 style="margin: 0; font-size: 1rem;">{item.title}</h6>
                <small class="text-muted" style="white-space: nowrap; margin-left: var(--space-2);">
                    {new Date(item.createdAt).toLocaleString()}
                </small>
            </div>
            <p style="margin: 0; color: var(--color-text-muted);">{item.message}</p>
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
            <h6 style="margin: 0;">From: {msg.from}</h6>
            <small class="text-muted">{new Date(msg.createdAt).toLocaleString()}</small>
        </div>
        <p style="margin: 0;">{msg.content}</p>
    </div>
);

const NotificationItem = ({ n }) => {
    const colorClass = n.level === 'ERROR' ? 'text-error' : (n.level === 'WARN' ? 'text-warning' : 'text-primary');
    // We don't have text-warning class in styles, using inline style fallback or var
    const titleColor = `var(--color-${n.level === 'INFO' ? 'primary' : n.level.toLowerCase()})`;

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

const SidebarNav = ({ activeTab }) => {
    const tabs = [
        { id: 'feed', label: 'Feed', href: '/ims/communication/feed' },
        { id: 'messages', label: 'Messages', href: '/ims/communication/messages' },
        { id: 'notifications', label: 'Notifications', href: '/ims/communication/notifications' }
    ];

    return (
        <div class="card p-0" style="overflow: hidden;">
            {tabs.map(tab => (
                <a
                    href={tab.href}
                    style={`
                        display: block;
                        padding: var(--space-3) var(--space-4);
                        text-decoration: none;
                        color: ${activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-main)'};
                        background-color: ${activeTab === tab.id ? 'var(--color-primary-light)' : 'transparent'};
                        border-left: 3px solid ${activeTab === tab.id ? 'var(--color-primary)' : 'transparent'};
                        font-weight: 500;
                    `}
                >
                    {tab.label}
                </a>
            ))}
        </div>
    );
};

export const CommunicationPage = ({ activeTab, feed, messages, notifications }) => {
    return (
        <div class="communication-page">
            <div class="page-header">
                <h1>Communication Hub</h1>
                <div style="font-size: var(--font-size-sm); color: var(--color-text-muted);">
                    <a href="/ims" style="color: var(--color-text-muted);">Home</a> / Communication
                </div>
            </div>

            <div style="display: flex; gap: var(--space-6); flex-wrap: wrap;">
                <div style="flex: 0 0 250px; min-width: 200px;">
                    <SidebarNav activeTab={activeTab} />
                </div>

                <div style="flex: 1; min-width: 0;">
                    {activeTab === 'feed' && (
                        <div class="card p-0">
                            <div style="padding: var(--space-4); border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center;">
                                <h2 style="margin: 0; font-size: 1.1rem;">Activity Feed</h2>
                                <button class="btn btn-sm btn-primary" disabled>New Post</button>
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
        </div>
    );
};
