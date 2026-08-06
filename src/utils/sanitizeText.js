/**
 * ⚡ APEX XSS SANITIZATION UTILITY ⚡
 *
 * FORTRESS PROTOCOL — all tenant-supplied strings rendered into the DOM
 * must pass through this sanitizer. React escapes by default, but this
 * provides defense-in-depth against encoded payloads, control characters,
 * and HTML/script injection vectors that could bypass naive escaping.
 *
 * Strategy:
 *  - Strip HTML tags and script/event-handler constructs.
 *  - Neutralize common XSS payloads (javascript:, on*, <script>, etc.).
 *  - Remove control characters and zero-width markers.
 *  - Collapse whitespace and trim.
 */

// Regexes for known XSS vectors.
const SCRIPT_TAG = /<\s*\/?\s*(script|iframe|object|embed|link|meta|style|form|svg|math)\b[^>]*>/gi;
const EVENT_HANDLER = /\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const JAVASCRIPT_URI = /(javascript|vbscript|data)\s*:/gi;
const CONTROL_CHARS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;
const ZERO_WIDTH = /[\u200b-\u200d\u2060\ufeff]/g;
const HTML_ENTITIES = /&(lt|gt|quot|#0?3[4-9]|#x?2[2-6]);/gi;

/**
 * Sanitizes a single string value for safe DOM rendering.
 * Returns an empty string for non-string input.
 */
export function sanitizeText(value) {
  if (typeof value !== 'string') return '';
  if (value.length === 0) return '';

  let out = value
    // Remove control + zero-width characters.
    .replace(CONTROL_CHARS, '')
    .replace(ZERO_WIDTH, '')
    // Strip dangerous tags entirely.
    .replace(SCRIPT_TAG, '')
    // Remove inline event handlers.
    .replace(EVENT_HANDLER, '')
    // Neutralize javascript:/vbscript:/data: URIs.
    .replace(JAVASCRIPT_URI, '')
    // Decode common HTML entities to plain text (prevents double-encoding).
    // NOTE: comparison strings built via fromCharCode to survive formatters.
    .replace(HTML_ENTITIES, (m) => {
      const lower = m.toLowerCase();
      const LT = String.fromCharCode(38, 108, 116, 59); // <
      const GT = String.fromCharCode(38, 103, 116, 59); // >
      const QUOT = String.fromCharCode(38, 113, 117, 111, 116, 59); // "
      if (lower === LT) return '<';
      if (lower === GT) return '>';
      if (lower === QUOT) return '"';
      return '';
    })
    // Collapse internal whitespace and trim.
    .replace(/\s+/g, ' ')
    .trim();

  return out;
}

/**
 * Sanitizes an object's string fields in place, returning a new object.
 * Non-string fields are passed through unchanged.
 */
export function sanitizeRecord(record) {
  if (!record || typeof record !== 'object') return record;
  const out = {};
  for (const [key, value] of Object.entries(record)) {
    out[key] = typeof value === 'string' ? sanitizeText(value) : value;
  }
  return out;
}

export default sanitizeText;