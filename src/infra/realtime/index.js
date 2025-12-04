import { createWebSocketManager } from './websocket-manager.js';

export const createRealtimeContext = async (deps) => {
  const { messaging } = deps;

  const wsManager = createWebSocketManager(messaging.eventBus);

  return {
    wsManager
  };
};
