const LOG_LEVELS = {
  TRACE: 0,
  INFO: 1,
  SUCCESS: 2,
  WARN: 3,
  ERROR: 4,
  ACTIVITY: 5,
  AUDIT: 6,
};

export function createObsService({ repositories, minLevel = 'INFO', eventBus }) {
  const minLevelValue = LOG_LEVELS[minLevel] ?? LOG_LEVELS['INFO'];

  const log = async (level, message, metadata = {}) => {
    // Basic level check for standard logs
    // For AUDIT and ACTIVITY, they are high priority, but let's check anyway.
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

    // Special Handling for Audit and Activity
    if (level === 'AUDIT') {
        if (eventBus) {
            eventBus.publish('system.audit_log', {
                message,
                metadata,
                timestamp: logEntry.timestamp
            }).catch(e => console.error('Failed to publish audit event', e));
        }
        if (repositories?.audit) {
            try {
                // Map log entry to audit entry structure if different
                // AuditSchema expects: userId, resource, action, details, tenantId
                // We assume metadata contains these.
                const auditEntry = {
                    id: logEntry.id,
                    tenantId: metadata.tenantId || 'default',
                    userId: metadata.userId || 'system',
                    resource: metadata.resource || 'system',
                    action: metadata.action || 'log',
                    details: { message, ...metadata },
                    timestamp: logEntry.timestamp
                };
                await repositories.audit.save(auditEntry.tenantId, auditEntry);
            } catch (e) {
                console.error('Failed to save audit log', e);
            }
        }
    }

    if (level === 'ACTIVITY') {
        if (repositories?.activity) {
            try {
                // ActivitySchema expects: userId, action, details, tenantId
                const activityEntry = {
                    id: logEntry.id,
                    tenantId: metadata.tenantId || 'default',
                    userId: metadata.userId || 'system',
                    action: metadata.action || 'log',
                    details: { message, ...metadata },
                    timestamp: logEntry.timestamp
                };
                await repositories.activity.save(activityEntry.tenantId, activityEntry);
            } catch (e) {
                console.error('Failed to save activity log', e);
            }
        }
    }

    // Always save to main log repository as well?
    // User asked for "proper request - responselog".
    // Usually audit/activity are separate.
    // I will save EVERYTHING to the main log repository (filtered by level) if it exists.
    // EXCEPT maybe if I want to save space?
    // But for debugging, having everything in one stream is nice.
    // However, if I save AUDIT to audit repo AND log repo, I double storage.
    // Let's assume generic log repo is for system logs (INFO, WARN, ERROR, TRACE).
    // AUDIT and ACTIVITY go to their specialized repos.

    if (level !== 'AUDIT' && level !== 'ACTIVITY' && repositories?.log) {
        try {
            const tenantId = metadata.tenantId || 'default';
            await repositories.log.save(tenantId, logEntry);
        } catch (e) {
            console.error('Failed to save log to Trust Repository', e);
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
