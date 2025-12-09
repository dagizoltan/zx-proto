import { h } from 'preact';

const MessageBubble = ({ msg, isMe }) => (
    <div style={`
        display: flex;
        flex-direction: column;
        align-items: ${isMe ? 'flex-end' : 'flex-start'};
        margin-bottom: var(--space-4);
    `}>
        <div style={`
            max-width: 70%;
            padding: var(--space-3) var(--space-4);
            border-radius: var(--radius-lg);
            background-color: ${isMe ? 'var(--color-primary)' : 'var(--color-bg-subtle)'};
            color: ${isMe ? 'var(--color-text-inverted)' : 'var(--color-text-main)'};
            border-bottom-${isMe ? 'right' : 'left'}-radius: 0;
        `}>
            <div style="margin-bottom: var(--space-1); font-size: 0.75rem; opacity: 0.8; font-weight: 600;">
                {msg.from}
            </div>
            <div style="line-height: 1.4;">
                {msg.content}
            </div>
        </div>
        <small style="margin-top: var(--space-1); font-size: 0.7rem; color: var(--color-text-muted);">
            {new Date(msg.createdAt).toLocaleString()}
        </small>
    </div>
);

export const ConversationDetailPage = ({ conversation, user }) => {
    // Determine who "Me" is for styling.
    // user prop comes from layout/context.
    // Usually user.email or user.id matches msg.from if we store IDs.
    // For now assuming msg.from stores 'admin' or email/name.

    const isMe = (sender) => {
        // Simple heuristic for demo
        if (sender === 'me' || sender === user.email || sender === user.name || (sender === 'admin' && user.email.includes('admin'))) return true;
        return false;
    };

    return (
        <div class="conversation-detail-page" style="height: calc(100vh - 140px); display: flex; flex-direction: column;">
             <div class="page-header" style="flex-shrink: 0;">
                <div style="display: flex; align-items: center; gap: var(--space-2);">
                    <a href="/ims/communication/conversations" class="btn btn-sm btn-secondary">← Back</a>
                    <h1 style="margin: 0; font-size: 1.25rem;">{conversation.subject}</h1>
                </div>
                <div style="font-size: var(--font-size-sm); color: var(--color-text-muted);">
                    Participants: {conversation.participants.join(', ')}
                </div>
            </div>

            <div class="card p-0" style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
                <div style="flex: 1; overflow-y: auto; padding: var(--space-6); display: flex; flex-direction: column-reverse;">
                    {/* Reverse order for chat usually, but if array is chrono, we just render normally but scroll to bottom.
                        Let's render normally and assume we scroll or flex-direction column.
                        Actually standard is rendering top-down.
                    */}
                    <div style="display: flex; flex-direction: column;">
                         {(conversation.messages || []).map(msg => <MessageBubble msg={msg} isMe={isMe(msg.from)} />)}
                    </div>
                </div>

                <div style="padding: var(--space-4); background-color: var(--color-bg-subtle); border-top: 1px solid var(--color-border);">
                    <form method="POST" action={`/api/communication/conversations/${conversation.id}/messages`}>
                        {/* Note: This form action would need an API route handler.
                            For this refactor we assume Client-Side logic or standard POST handler.
                            Since we are SSR, we probably need a UI handler for POST or use API.
                            Let's placeholder the UI.
                        */}
                        <div style="display: flex; gap: var(--space-2);">
                            <input
                                type="text"
                                name="content"
                                placeholder="Type a message..."
                                style="flex: 1;"
                                required
                            />
                            <button type="submit" class="btn btn-primary">Send</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
