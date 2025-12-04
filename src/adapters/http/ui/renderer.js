import { h } from 'preact';
import render from 'preact-render-to-string';
import { MainLayout } from './layouts/main-layout.jsx';

export const renderPage = async (PageComponent, props) => {
  // Render page component
  const pageHtml = render(h(PageComponent, props));

  // Choose layout based on props or default
  const Layout = props.layout || MainLayout;

  // Wrap in layout
  const layoutProps = {
      user: props.user,
      title: props.title || 'IMS Shopfront',
      ...props // Pass all props to layout
  };

  const fullHtml = render(
    h(Layout, {
      ...layoutProps,
      children: h('div', { dangerouslySetInnerHTML: { __html: pageHtml } }),
    })
  );

  // Add resumability state
  const stateScript = `
    <script type="application/json" id="__RESUMABLE_STATE__">
      ${JSON.stringify(props)}
    </script>
    <script type="module">
      import { hydrate } from '/static/js/resumability-runtime.js';
      hydrate();
    </script>
  `;

  return `<!DOCTYPE html>${fullHtml}${stateScript}`;
};
