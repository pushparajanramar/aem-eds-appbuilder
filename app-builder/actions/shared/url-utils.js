/**
 * URL Safety Utilities for BYOM action HTML rendering.
 *
 * Validates that URLs use safe schemes before embedding them in HTML.
 * Prevents injection of javascript: or data: URIs into rendered markup.
 */

const SAFE_HREF_SCHEMES = ['https:', 'http:'];

/**
 * Allowlist of permitted BFF proxy module names.
 * Only these modules may be addressed through the bff-proxy action.
 * This prevents path-traversal attacks that have historically exposed
 * internal services (e.g. leaked account records via ../ traversal).
 */
const ALLOWED_BFF_MODULES = new Set([
  'orchestra',
  'stream',
  'loyalty',
  'card',
  'orderhistory',
  'product',
  'promotion',
  'rewards',
  'location',
  'offers',
  'billingaddress',
  'barcode',
]);

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

/**
 * Validates a BFF proxy module name against the allowlist.
 * Returns the module name if permitted, or null otherwise.
 * Prevents path-traversal and injection via module routing.
 *
 * @param {string} module
 * @returns {string|null}
 */
function sanitizeBffModule(module) {
  if (!module) return null;
  const name = String(module).trim().toLowerCase();
  // Reject anything containing path separators — the allowlist already enforces valid names
  if (/[/\\]/.test(name)) return null;
  return ALLOWED_BFF_MODULES.has(name) ? name : null;
}

/**
 * Build an Adobe Dynamic Media (Scene7) URL for a given image and width.
 *
 * Appends (or overrides) the standard Dynamic Media image-serving parameters:
 *   wid  – pixel width of the requested rendition
 *   fmt  – image format (default: webp for broad browser support)
 *   qlt  – quality level 0–100 (default: 85)
 *
 * If the input URL is not a valid absolute URL it is returned unchanged so that
 * relative or placeholder URLs used in tests/stubs are not corrupted.
 *
 * @param {string} imageUrl  - Original image URL (absolute Dynamic Media URL)
 * @param {number} width     - Desired pixel width for this rendition
 * @param {object} [options]
 * @param {string} [options.format='webp'] - Image format (webp | jpeg | png)
 * @param {number} [options.quality=85]    - JPEG/WebP quality (1–100)
 * @returns {string}
 */
function buildDynamicMediaUrl(imageUrl, width, options = {}) {
  if (!imageUrl) return '';
  const str = String(imageUrl).trim();
  if (!str) return '';

  const { format = 'webp', quality = 85 } = options;

  try {
    const url = new URL(str);
    url.searchParams.set('wid', String(width));
    url.searchParams.set('fmt', format);
    url.searchParams.set('qlt', String(quality));
    return url.toString();
  } catch {
    // Relative paths or non-URL strings are returned as-is
    return str;
  }
}

module.exports = { safeUrl, sanitizeBffModule, ALLOWED_BFF_MODULES, buildDynamicMediaUrl };
