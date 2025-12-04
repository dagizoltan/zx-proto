export const createWebSocketManager = (eventBus) => {
  const clients = new Map();
  const subscriptions = new Map();

  const handleConnection = (ws, userId) => {
    const id = userId || `anon-${crypto.randomUUID()}`;

    clients.set(id, ws);
    subscriptions.set(id, new Set());

    ws.onclose = () => {
      clients.delete(id);
      subscriptions.delete(id);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleMessage(id, msg);
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };
  };

  const handleMessage = (userId, message) => {
    switch (message.type) {
      case 'subscribe':
        subscribe(userId, message.channel);
        break;
      case 'unsubscribe':
        unsubscribe(userId, message.channel);
        break;
    }
  };

  const subscribe = (userId, channel) => {
    const userSubs = subscriptions.get(userId);
    if (userSubs) {
      userSubs.add(channel);
    }
  };

  const unsubscribe = (userId, channel) => {
    const userSubs = subscriptions.get(userId);
    if (userSubs) {
      userSubs.delete(channel);
    }
  };

  const broadcast = (channel, data) => {
    for (const [userId, channels] of subscriptions.entries()) {
      if (channels.has(channel)) {
        const ws = clients.get(userId);
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ channel, data }));
        }
      }
    }
  };

  const sendToUser = (userId, data) => {
    const ws = clients.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  };

  eventBus.subscribe('*', (event) => {
    broadcast(event.type, event);
  });

  return { handleConnection, broadcast, sendToUser };
};
