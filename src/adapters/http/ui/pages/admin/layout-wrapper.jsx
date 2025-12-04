import { h } from 'preact';
import { AdminLayout } from '../../layouts/admin-layout.jsx';

export const AdminLayoutWrapper = (props) => {
    // We can't easily wrap inside the page component if the renderer handles layout.
    // But the renderer uses MainLayout by default.
    // We need to update the renderer or routes to allow specifying layout.
    // For now, I will assume the route handler handles the layout wrapping or passing the layout component.
    // Wait, my `renderer.js` hardcodes `MainLayout`.
    // I need to update `renderer.js` to accept a layout component.
    return <AdminLayout {...props} />;
}
