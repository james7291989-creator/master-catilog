/**
 * ⚡ APEX STRUCTURED JSON LOGGING ⚡
 *
 * FORTRESS PROTOCOL — enterprise observability.
 * Emits structured, single-line JSON log records for catalog access,
 * authentication, and billing gateways. In production, pipe these to
 * a log aggregator (Datadog, Grafana Loki, CloudWatch) via the
 * `APEX_LOG_ENDPOINT` webhook.
 *
 * Every record includes:
 *  - timestamp (ISO-8601)
 *  - level
 *  - event name
 *  - correlation id (per-session)
 *  - tenant context (when available)
 */

// Correlation ID — stable per page session for tracing.
const correlationId =
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `corr-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

function emit(level, event, fields = {}) {
  const record = {
    ts: new Date().toISOString(),
    level,
    event,
    correlationId,
    ...fields,
  };

  // Single-line JSON for log aggregators.
  const line = JSON.stringify(record);

  if (level === 'ERROR') {
    console.error(line);
  } else if (level === 'WARN') {
    console.warn(line);
  } else {
    console.log(line);
  }

  // Optional remote shipping (no-op unless configured).
  const endpoint = import.meta.env.VITE_APEX_LOG_ENDPOINT;
  if (endpoint && level !== 'DEBUG') {
    // Fire-and-forget; never block the UI thread.
    try {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: line,
        keepalive: true,
      }).catch(() => { /* silent */ });
    } catch { /* silent */ }
  }
}

export const logEvent = (event, fields = {}) => emit('INFO', event, fields);
export const logWarn = (event, fields = {}) => emit('WARN', event, fields);
export const logError = (event, fields = {}) => emit('ERROR', event, fields);
export const logDebug = (event, fields = {}) => emit('DEBUG', event, fields);

export default { logEvent, logWarn, logError, logDebug };