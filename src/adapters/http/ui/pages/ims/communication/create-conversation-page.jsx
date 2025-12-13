import { h } from 'preact';

export const CreateConversationPage = ({ user, users = [] }) => {
    return (
        <div class="create-conversation-page">
            <div class="header-actions" style="margin-bottom: var(--space-4); display: flex; justify-content: space-between; align-items: center;">
                <h1 style="margin: 0; font-size: 1.5rem;">New Conversation</h1>
                <a href="/ims/communication/conversations" class="btn btn-secondary">Cancel</a>
            </div>

            <div class="card" style="max-width: 600px; padding: var(--space-6);">
                <form method="POST" action="/ims/communication/conversations">

                    <div class="form-group" style="margin-bottom: var(--space-4);">
                        <label style="display: block; margin-bottom: var(--space-2); font-weight: 500;">Recipients</label>
                        <select name="to" multiple required style="width: 100%; min-height: 100px; padding: var(--space-2); border: 1px solid var(--color-border); border-radius: var(--radius-md);">
                            {users.map(u => (
                                <option value={u.id}>{u.name} ({u.email})</option>
                            ))}
                        </select>
                        <small class="text-muted" style="display: block; margin-top: var(--space-1); font-size: 0.8rem;">Hold Ctrl/Cmd to select multiple recipients.</small>
                    </div>

                    <div class="form-group" style="margin-bottom: var(--space-4);">
                        <label style="display: block; margin-bottom: var(--space-2); font-weight: 500;">Message</label>
                        <textarea
                            name="content"
                            required
                            placeholder="Type your first message..."
                            rows="5"
                            style="width: 100%; padding: var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-family: inherit;"
                        ></textarea>
                    </div>

                    <div class="form-actions" style="display: flex; justify-content: flex-end;">
                        <button type="submit" class="btn btn-primary">Start Conversation</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
