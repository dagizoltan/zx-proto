import { renderPage } from '../../renderer.js';
import { CreateFeedPostPage } from '../../pages/ims/communication/create-feed-post-page.jsx';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { isErr } from '../../../../../../lib/trust/index.js';

export const getCreateFeedPostPage = async (c) => {
    return c.html(await renderPage(CreateFeedPostPage, {
        layout: AdminLayout,
        title: 'New Post - Communication',
        user: c.get('user'),
        values: {}
    }));
};

export const handleCreateFeedPost = async (c) => {
    const body = await c.req.parseBody();
    const content = body.content;
    const user = c.get('user');
    const tenantId = c.get('tenantId');

    // Simple validation
    if (!content || content.trim() === '') {
        return c.html(await renderPage(CreateFeedPostPage, {
            layout: AdminLayout,
            title: 'New Post - Communication',
            user: user,
            error: 'Content is required',
            values: { content }
        }));
    }

    const { postFeedItem } = c.ctx.get('domain.communication').useCases;

    const result = await postFeedItem(tenantId, {
        content: content,
        authorId: user.id,
        channelId: 'general', // Hardcoded as per requirements
        type: 'post'
    });

    if (isErr(result)) {
        return c.html(await renderPage(CreateFeedPostPage, {
            layout: AdminLayout,
            title: 'New Post - Communication',
            user: user,
            error: result.error.message || 'Failed to create post',
            values: { content }
        }));
    }

    return c.redirect('/ims/communication/feed');
};
