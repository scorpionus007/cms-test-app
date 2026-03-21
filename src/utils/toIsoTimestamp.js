/**
 * Normalize a Date or parseable value to ISO-8601 UTC with millisecond precision (e.g. 2025-03-05T12:34:56.789Z).
 * @param {Date|string|number|null|undefined} value
 * @returns {string|null}
 */
function toIsoTimestamp(value) {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

module.exports = { toIsoTimestamp };
