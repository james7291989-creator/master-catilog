// ⚡ APEX CTO OVERRIDE: FILENAME SANITIZATION LOCKDOWN ⚡
// Strips path separators, control characters, and reserved filename
// characters so download strings can never escape the intended
// directory or produce an invalid file name.
export default function sanitizeFilename(name) {
  if (!name) return 'Untitled_Track';
  return String(name)
    // Remove path traversal and separators
    .replace(/[\\/]/g, '_')
    // Remove control characters and reserved Windows filename chars
    // eslint-disable-next-line no-control-regex -- intentional filename lockdown
    .replace(/[\x00-\x1f<>:"|?*]/g, '')
    // Collapse whitespace runs into single underscores
    .replace(/\s+/g, '_')
    // Trim leading/trailing dots and spaces (Windows reserved)
    .replace(/^[.\s]+|[.\s]+$/g, '')
    // Fallback if everything was stripped away
    .trim() || 'Untitled_Track';
}
