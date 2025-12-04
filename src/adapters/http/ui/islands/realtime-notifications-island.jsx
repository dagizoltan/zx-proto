import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { NotificationToast } from '../components/notification-toast.jsx';

export const RealtimeNotificationsIsland = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Use current host for websocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/?userId=${userId}`;

    console.log('Connecting to WebSocket:', wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
      // Subscribe to user specific events and general system events
      ws.send(JSON.stringify({ type: 'subscribe', channel: `user:${userId}` }));
      ws.send(JSON.stringify({ type: 'subscribe', channel: 'system' }));
      ws.send(JSON.stringify({ type: 'subscribe', channel: 'stock.updated' }));
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WS Message:', data);

        // Handle channel messages wrapper
        const payload = data.data || data;

        if (payload.type === 'stock.updated') {
            addNotification(`Stock updated for product ${payload.payload.productId}`, 'info');
        } else if (payload.type === 'order.created') {
            addNotification(`New order received! Total: $${payload.payload.total}`, 'success');
        } else {
             // Generic fallback
            if (payload.message) {
                addNotification(payload.message, 'info');
            }
        }
      } catch (e) {
        console.error('Error parsing WS message', e);
      }
    };

    return () => {
      ws.close();
    };
  }, [userId]);

  const addNotification = (message, type) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);

    // Auto remove after 5s
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (!connected && notifications.length === 0) return null;

  return (
    <div class="notifications-container" style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
      {notifications.map(n => (
        <NotificationToast
          key={n.id}
          message={n.message}
          type={n.type}
          onClose={() => removeNotification(n.id)}
        />
      ))}
      {!connected && userId && (
         <div class="connection-status" style={{ fontSize: '0.8rem', color: 'gray', textAlign: 'right' }}>
            Reconnecting...
         </div>
      )}
    </div>
  );
};
