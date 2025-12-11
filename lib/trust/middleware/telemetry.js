import { Result } from '../types.js';

/**
 * Telemetry Middleware
 * Connects to the platform's 'obs' layer.
 */
export const useTelemetry = (obs, spanName) => (next) => async (ctx, data) => {
  if (!obs) return next(ctx, data);

  const span = `${spanName}.${ctx.operation}`;

  // Trace the operation
  try {
    const result = await obs.traceSpan(span, async () => {
       return await next(ctx, data);
    });

    // Check for Logic Errors returned as Result
    if (!result.ok) {
        obs.warn(`${span}.failed`, { error: result.error, tenantId: ctx.tenantId });
    }

    return result;

  } catch (e) {
    // Catch unexpected exceptions (bugs)
    obs.error(`${span}.crashed`, { error: e.message, stack: e.stack });
    throw e;
  }
};
