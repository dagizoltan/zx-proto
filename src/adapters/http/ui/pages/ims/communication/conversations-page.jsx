import { h } from 'preact';

const ConversationItem = ({ conv }) => {
    // Safety for missing participants/subject
    const participants = (conv.participants || []).join(', ');
    const subject = conv.subject || (conv.participantNames ? conv.participantNames.join(', ') : 'Conversation');

    return (
    <a href={`/ims/communication/conversations/${conv.id}`} style="display: block; padding: var(--space-4); border-bottom: 1px solid var(--color-border); text-decoration: none; color: inherit; transition: background-color 0.2s;">
        <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-1);">
            <div style="font-weight: 600; color: var(--color-text-main);">{subject}</div>
            <small class="text-muted">{new Date(conv.updatedAt).toLocaleString()}</small>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
             <div style="color: var(--color-text-muted); font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 80%;">
                {/* Fallback for lastSender/lastMessage */}
                <span style="font-weight: 500; margin-right: var(--space-1);">{conv.lastSender || 'System'}:</span>
                {conv.lastMessage || conv.lastMessagePreview || 'No messages'}
             </div>
        </div>
        <div style="margin-top: var(--space-2); font-size: 0.8rem; color: var(--color-text-muted);">
            Participants: {participants}
        </div>
    </a>
    );
};

export const ConversationsPage = ({ conversations }) => {
    return (
        <div class="conversations-page">
             <div class="page-header">
                <h1>Conversations</h1>
                <div style="font-size: var(--font-size-sm); color: var(--color-text-muted);">
                    <a href="/ims" style="color: var(--color-text-muted);">Home</a> / Communication / Conversations
                </div>
            </div>

            <div class="card p-0">
                <div style="padding: var(--space-4); border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0; font-size: 1.1rem;">Inbox</h2>
                    <button class="btn btn-sm btn-primary">New Message</button>
                </div>
                <div>
                    {(conversations || []).map(c => <ConversationItem conv={c} />)}
                    {(conversations || []).length === 0 && <div style="padding: var(--space-6); text-align: center; color: var(--color-text-muted);">No conversations yet.</div>}
                </div>
            </div>
        </div>
    );
};
