import { h } from 'preact';

const FeedItem = ({ item }) => (
    <div class="list-group-item list-group-item-action d-flex gap-3 py-3" aria-current="true">
        <div class="d-flex gap-2 w-100 justify-content-between">
            <div>
                <h6 class="mb-0">{item.title}</h6>
                <p class="mb-0 opacity-75">{item.message}</p>
                {item.link && <a href={item.link} class="btn btn-sm btn-link px-0">View Details</a>}
            </div>
            <small class="text-nowrap text-muted">{new Date(item.createdAt).toLocaleString()}</small>
        </div>
    </div>
);

const MessageItem = ({ msg }) => (
    <div class="list-group-item list-group-item-action py-3">
        <div class="d-flex w-100 justify-content-between">
            <h6 class="mb-1">From: {msg.from}</h6>
            <small class="text-muted">{new Date(msg.createdAt).toLocaleString()}</small>
        </div>
        <p class="mb-1">{msg.content}</p>
    </div>
);

export const CommunicationPage = ({ activeTab, feed, messages, notifications }) => {
    return (
        <div class="container-fluid">
            <header class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 class="h3 mb-2 text-gray-800">Communication Hub</h1>
                    <nav aria-label="breadcrumb">
                        <ol class="breadcrumb">
                            <li class="breadcrumb-item"><a href="/ims">Home</a></li>
                            <li class="breadcrumb-item active">Communication</li>
                        </ol>
                    </nav>
                </div>
            </header>

            <div class="row">
                <div class="col-md-3">
                    <div class="list-group">
                        <a href="/ims/communication/feed" class={`list-group-item list-group-item-action ${activeTab === 'feed' ? 'active' : ''}`}>
                            Feed
                        </a>
                        <a href="/ims/communication/messages" class={`list-group-item list-group-item-action ${activeTab === 'messages' ? 'active' : ''}`}>
                            Messages
                        </a>
                        <a href="/ims/communication/notifications" class={`list-group-item list-group-item-action ${activeTab === 'notifications' ? 'active' : ''}`}>
                            Notifications
                        </a>
                    </div>
                </div>

                <div class="col-md-9">
                    {activeTab === 'feed' && (
                        <div class="card">
                            <div class="card-header bg-white d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">Activity Feed</h5>
                                <button class="btn btn-primary btn-sm" disabled>New Post</button>
                            </div>
                            <div class="list-group list-group-flush">
                                {(feed || []).map(item => <FeedItem item={item} />)}
                                {(feed || []).length === 0 && <div class="p-3 text-muted">No feed items yet.</div>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'messages' && (
                         <div class="card">
                            <div class="card-header bg-white d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">Messages</h5>
                                <button class="btn btn-primary btn-sm" disabled>Compose</button>
                            </div>
                            <div class="list-group list-group-flush">
                                {(messages || []).map(msg => <MessageItem msg={msg} />)}
                                {(messages || []).length === 0 && <div class="p-3 text-muted">No messages.</div>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div class="card">
                            <div class="card-header bg-white">
                                <h5 class="mb-0">Notifications</h5>
                            </div>
                            <div class="list-group list-group-flush">
                                {(notifications || []).map(n => (
                                    <div class="list-group-item list-group-item-action">
                                        <div class="d-flex w-100 justify-content-between">
                                            <h6 class={`mb-1 ${n.level === 'ERROR' ? 'text-danger' : 'text-primary'}`}>{n.title}</h6>
                                            <small>{new Date(n.createdAt).toLocaleString()}</small>
                                        </div>
                                        <p class="mb-1">{n.message}</p>
                                        {n.link && <a href={n.link} class="btn btn-sm btn-link px-0">View</a>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
