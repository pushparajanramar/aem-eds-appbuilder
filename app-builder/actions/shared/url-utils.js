/**
 * URL Safety Utilities for BYOM action HTML rendering.
 *
 * Validates that URLs use safe schemes before embedding them in HTML.
 * Prevents injection of javascript: or data: URIs into rendered markup.
 */

const SAFE_HREF_SCHEMES = ['https:', 'http:'];

/**
 * Validates that a URL uses a safe scheme (https or http).
 * Returns an empty string for unsafe or unparseable URLs.
 * Relative paths (starting with /) are always safe.
 *
 * @param {string} url
 * @returns {string}
 */
function safeUrl(url) {
  if (!url) return '';
  const str = String(url).trim();
  // Allow absolute paths on the same origin
  if (str.startsWith('/')) return str;
  try {
    const parsed = new URL(str);
    return SAFE_HREF_SCHEMES.includes(parsed.protocol) ? str : '';
  } catch {
    return '';
  }
}

module.exports = { safeUrl };
