const LOG_LEVELS = {
  TRACE: 0,
  INFO: 1,
  SUCCESS: 2,
  WARN: 3,
  ERROR: 4,
  AUDIT: 5,
};

export const createObs = (kvPool, minLevel = 'INFO', eventBus = null) => {
  const minLevelValue = LOG_LEVELS[minLevel] ?? LOG_LEVELS['INFO'];

  const log = async (level, message, metadata = {}) => {
    if ((LOG_LEVELS[level] ?? -1) < minLevelValue) return;

    const logEntry = {
      level,
      message,
      metadata,
      timestamp: new Date().toISOString(),
      trace_id: metadata.traceId || crypto.randomUUID(),
    };

    console.log(`[${logEntry.level}] ${logEntry.message}`, metadata);

    // Publish Audit events to EventBus for Domain Handling (System/AuditLogs)
    if (level === 'AUDIT' && eventBus) {
        // Fire and forget
        eventBus.publish('system.audit_log', {
            message,
            metadata,
            timestamp: logEntry.timestamp
        }).catch(e => console.error('Failed to publish audit event', e));
    }

    try {
      await kvPool.withConnection(async (kv) => {
        await kv.set(
          ['logs', level.toLowerCase(), logEntry.timestamp, logEntry.trace_id],
          logEntry,
          { expireIn: 30 * 24 * 60 * 60 * 1000 } // 30 days
        );
      });
    } catch (e) {
      console.error('Failed to write log to KV', e);
    }
  };

  const metric = async (name, value, tags = {}) => {
    const metricEntry = {
      name,
      value,
      tags,
      timestamp: new Date().toISOString(),
    };

    try {
      await kvPool.withConnection(async (kv) => {
        await kv.set(
          ['metrics', name, metricEntry.timestamp],
          metricEntry,
          { expireIn: 7 * 24 * 60 * 60 * 1000 } // 7 days
        );
      });
    } catch (e) {
      console.error('Failed to write metric to KV', e);
    }
  };

  const trace = async (spanName, fnOrMeta) => {
      if (typeof fnOrMeta !== 'function') {
          return log('TRACE', spanName, fnOrMeta);
      }

    const fn = fnOrMeta;
    const traceId = crypto.randomUUID();
    const startTime = performance.now();

    try {
      const result = await fn();
      const duration = performance.now() - startTime;

      await kvPool.withConnection(async (kv) => {
        await kv.set(
          ['traces', traceId],
          {
            spanName,
            traceId,
            duration,
            success: true,
            timestamp: new Date().toISOString(),
          },
          { expireIn: 24 * 60 * 60 * 1000 } // 24 hours
        );
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      await kvPool.withConnection(async (kv) => {
        await kv.set(
          ['traces', traceId],
          {
            spanName,
            traceId,
            duration,
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
          },
          { expireIn: 24 * 60 * 60 * 1000 }
        );
      });

      throw error;
    }
  };

  return {
    trace,
    info: (msg, meta) => log('INFO', msg, meta),
    success: (msg, meta) => log('SUCCESS', msg, meta),
    warn: (msg, meta) => log('WARN', msg, meta),
    error: (msg, meta) => log('ERROR', msg, meta),
    audit: (msg, meta) => log('AUDIT', msg, meta),
    metric,
    traceSpan: trace,
  };
};
