/**
 * URL Safety Utilities for Fastly Compute handler HTML rendering.
 *
 * Validates that URLs use safe schemes before embedding them in HTML.
 * Prevents injection of javascript: or data: URIs into rendered markup.
 */

const SAFE_HREF_SCHEMES = ['https:', 'http:'];

/**
 * Allowlist of permitted BFF proxy module names.
 * Only these modules may be addressed through the bff-proxy handler.
 */
export const ALLOWED_BFF_MODULES = new Set([
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
export function safeUrl(url) {
  if (!url) return '';
  const str = String(url).trim();
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
 *
 * @param {string} module
 * @returns {string|null}
 */
export function sanitizeBffModule(module) {
  if (!module) return null;
  const name = String(module).trim().toLowerCase();
  if (/[/\\]/.test(name)) return null;
  return ALLOWED_BFF_MODULES.has(name) ? name : null;
}

/**
 * Build an Adobe Dynamic Media (Scene7) URL for a given image and width.
 *
 * @param {string} imageUrl
 * @param {number} width
 * @param {object} [options]
 * @param {string} [options.format='webp']
 * @param {number} [options.quality=85]
 * @returns {string}
 */
export function buildDynamicMediaUrl(imageUrl, width, options = {}) {
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
    return str;
  }
}

/**
 * Build a `srcset` string with multiple width-descriptor entries from Adobe Dynamic Media.
 *
 * @param {string} imageUrl
 * @param {number} baseWidth
 * @param {string} [format='webp']
 * @returns {string}
 */
export function buildDynamicMediaSrcset(imageUrl, baseWidth, format = 'webp') {
  if (!imageUrl) return '';
  const widths = [Math.round(baseWidth * 0.5), baseWidth, Math.round(baseWidth * 2)];
  return widths
    .map((w) => `${buildDynamicMediaUrl(imageUrl, w, { format })} ${w}w`)
    .join(', ');
}
