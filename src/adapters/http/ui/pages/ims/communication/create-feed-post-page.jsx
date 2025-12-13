import { h } from 'preact';

export const CreateFeedPostPage = ({ error, values }) => {
    return (
        <div class="create-feed-post-page">
            <div class="page-header">
                <h1>Create New Post</h1>
                <div style="font-size: var(--font-size-sm); color: var(--color-text-muted);">
                    <a href="/ims" style="color: var(--color-text-muted);">Home</a> /
                    <a href="/ims/communication/feed" style="color: var(--color-text-muted);"> Communication</a> /
                    New Post
                </div>
            </div>

            <div class="card" style="max-width: 600px; margin-top: var(--space-4);">
                {error && (
                    <div class="alert alert-error" style="margin-bottom: var(--space-4);">
                        {error}
                    </div>
                )}

                <form method="POST" action="/ims/communication/feed/new">
                    <div class="form-group">
                        <label for="content">Message Content</label>
                        <textarea
                            id="content"
                            name="content"
                            class="form-control"
                            rows="5"
                            placeholder="What's on your mind?"
                            required
                        >{values?.content || ''}</textarea>
                    </div>

                    <div class="form-actions" style="display: flex; gap: var(--space-2); margin-top: var(--space-4);">
                        <button type="submit" class="btn btn-primary">Post Message</button>
                        <a href="/ims/communication/feed" class="btn btn-secondary">Cancel</a>
                    </div>
                </form>
            </div>
        </div>
    );
};
