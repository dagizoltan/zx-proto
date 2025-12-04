// src/adapters/http/ui/static/js/resumability-runtime.js

export const hydrate = () => {
  const stateElement = document.getElementById('__RESUMABLE_STATE__');
  if (stateElement) {
    try {
      const state = JSON.parse(stateElement.textContent);
      console.log('💧 Resumability hydrated state:', state);
      // In a real framework (like Qwik), this would re-attach listeners
      // For this demo, we just log it to show the data was transferred.
      window.__APP_STATE__ = state;
    } catch (e) {
      console.error('Hydration failed', e);
    }
  }

  // Simple island hydration for notifications
  // In a real app we'd load the component dynamically or use a framework
  const notifyIsland = document.getElementById('notifications-island');
  if (notifyIsland) {
      const userId = notifyIsland.dataset.userId;
      if (userId) {
          console.log('Hydrating notification island for user:', userId);
          // Since we can't easily import JSX/Preact in browser without build step in this demo context,
          // We will rely on the fact that if this was built, we'd hydrate here.
          // For this specific demo environment which is raw file serving, we can't execute the Preact Island
          // without importing Preact from CDN.
          // Let's inject a script that does a simple WS connection using vanilla JS to prove the point.

          const script = document.createElement('script');
          script.type = 'module';
          script.textContent = `
            const userId = "${userId}";
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = \`\${protocol}//\${window.location.host}/?userId=\${userId}\`;

            console.log('Island: Connecting to ' + wsUrl);
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                ws.send(JSON.stringify({ type: 'subscribe', channel: 'stock.updated' }));
            };

            ws.onmessage = (e) => {
                try {
                    const data = JSON.parse(e.data);
                    const payload = data.data || data;
                    if (payload.type === 'stock.updated' || payload.type === 'order.created') {
                        const div = document.createElement('div');
                        div.className = 'toast toast-info';
                        div.innerHTML = '<span class="message">' + (payload.type === 'stock.updated' ? 'Stock Updated!' : 'Order Created!') + '</span>';
                        div.style.position = 'fixed';
                        div.style.bottom = '20px';
                        div.style.right = '20px';
                        div.style.zIndex = '9999';
                        document.body.appendChild(div);
                        setTimeout(() => div.remove(), 5000);
                    }
                } catch(err) {}
            };
          `;
          document.body.appendChild(script);
      }
  }
};
