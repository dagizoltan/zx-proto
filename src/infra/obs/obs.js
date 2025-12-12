const LOG_LEVELS = {
  TRACE: 0,
  INFO: 1,
  SUCCESS: 2,
  WARN: 3,
  ERROR: 4,
  ACTIVITY: 5,
  AUDIT: 6,
};

export function createObs(configOrPool, minLevelArg = 'INFO', eventBusArg = null) {
  // Support legacy signature (kvPool, minLevel, eventBus) for backward compatibility if any callers remain
  let kvPool, minLevel, eventBus, repositories;

  if (arguments.length > 1 || (configOrPool && configOrPool.withConnection)) {
     // Legacy signature
     kvPool = configOrPool;
     minLevel = minLevelArg || 'INFO';
     eventBus = eventBusArg || null;
     console.warn('Using legacy createObs signature. Repositories will not be used.');
  } else {
     // New signature object
     ({ kvPool, minLevel = 'INFO', eventBus, repositories } = configOrPool);
  }

  const minLevelValue = LOG_LEVELS[minLevel] ?? LOG_LEVELS['INFO'];

  const log = async (level, message, metadata = {}) => {
    if ((LOG_LEVELS[level] ?? -1) < minLevelValue) return;

    const logEntry = {
      id: crypto.randomUUID(),
      level,
      message,
      metadata,
      timestamp: new Date().toISOString(),
      trace_id: metadata.traceId || crypto.randomUUID(),
    };

    console.log(`[${logEntry.level}] ${logEntry.message}`, metadata);

    if (level === 'AUDIT' && eventBus) {
        eventBus.publish('system.audit_log', {
            message,
            metadata,
            timestamp: logEntry.timestamp
        }).catch(e => console.error('Failed to publish audit event', e));
    }

    if (repositories?.log) {
        try {
            // Use tenantId from metadata, or 'default' if not present (Trust layer needs tenantId)
            const tenantId = metadata.tenantId || 'default';
            await repositories.log.save(tenantId, logEntry);
        } catch (e) {
            console.error('Failed to save log to Trust Repository', e);
        }
    } else if (kvPool) {
        // Fallback to raw KV if no repo provided
        try {
          await kvPool.withConnection(async (kv) => {
            let key;
            const tenantId = metadata.tenantId;
            if (tenantId) {
                key = ['tenants', tenantId, 'logs', level.toLowerCase(), logEntry.timestamp, logEntry.trace_id];
            } else {
                key = ['logs', level.toLowerCase(), logEntry.timestamp, logEntry.trace_id];
            }
            await kv.set(key, logEntry, { expireIn: 30 * 24 * 60 * 60 * 1000 });
          });
        } catch (e) {
          console.error('Failed to write log to KV', e);
        }
    }
  };

  const metric = async (name, value, tags = {}) => {
    const metricEntry = {
      id: crypto.randomUUID(),
      name,
      value,
      tags,
      timestamp: new Date().toISOString(),
    };

    if (repositories?.metric) {
        try {
            const tenantId = tags.tenantId || 'default';
            await repositories.metric.save(tenantId, metricEntry);
        } catch (e) {
             console.error('Failed to save metric to Trust Repository', e);
        }
    } else if (kvPool) {
        try {
          await kvPool.withConnection(async (kv) => {
            await kv.set(
              ['metrics', name, metricEntry.timestamp],
              metricEntry,
              { expireIn: 7 * 24 * 60 * 60 * 1000 }
            );
          });
        } catch (e) {
          console.error('Failed to write metric to KV', e);
        }
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
      const entry = {
        id: crypto.randomUUID(),
        spanName,
        traceId,
        duration,
        success: true,
        timestamp: new Date().toISOString(),
      };

      if (repositories?.trace) {
          try {
               await repositories.trace.save('default', entry);
          } catch (e) { console.error('Failed to save trace', e); }
      } else if (kvPool) {
          await kvPool.withConnection(async (kv) => {
            await kv.set(['traces', traceId], entry, { expireIn: 24 * 60 * 60 * 1000 });
          });
      }

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      const entry = {
        id: crypto.randomUUID(),
        spanName,
        traceId,
        duration,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };

      if (repositories?.trace) {
           try {
               await repositories.trace.save('default', entry);
          } catch (e) { console.error('Failed to save trace', e); }
      } else if (kvPool) {
          await kvPool.withConnection(async (kv) => {
            await kv.set(['traces', traceId], entry, { expireIn: 24 * 60 * 60 * 1000 });
          });
      }

      throw error;
    }
  };

  return {
    trace,
    info: (msg, meta) => log('INFO', msg, meta),
    success: (msg, meta) => log('SUCCESS', msg, meta),
    warn: (msg, meta) => log('WARN', msg, meta),
    error: (msg, meta) => log('ERROR', msg, meta),
    activity: (msg, meta) => log('ACTIVITY', msg, meta),
    audit: (msg, meta) => log('AUDIT', msg, meta),
    metric,
    traceSpan: trace,
  };
};
