import { h } from 'preact';
import render from 'preact-render-to-string';
import { MainLayout } from './layouts/main-layout.jsx';

export const renderPage = async (PageComponent, props) => {
  // Render page component
  const pageHtml = render(h(PageComponent, props));

  // Wrap in layout
  // We can pass the user and other global props to layout if they exist in props
  const layoutProps = {
      user: props.user,
      title: props.title || 'IMS Shopfront',
      // ...other common props
  };

  const fullHtml = render(
    h(MainLayout, {
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
