import { createWebSocketManager } from './websocket-manager.js';
import { resolveDependencies } from '../../utils/registry/dependency-resolver.js';

export const createRealtimeContext = async (deps) => {
  const { eventBus } = resolveDependencies(deps, {
    eventBus: ['messaging.eventBus', 'eventBus']
  });

  const wsManager = createWebSocketManager(eventBus);

  return {
    wsManager
  };
};

export const RealtimeContext = {
    name: 'infra.realtime',
    dependencies: ['infra.messaging'],
    factory: createRealtimeContext
};
