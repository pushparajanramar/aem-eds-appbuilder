/**
 * Adobe Dynamic Media (Scene7) image helpers for Svelte Web Components.
 *
 * Builds device-aware image URLs and srcset strings so each component
 * requests the right rendition from Adobe Dynamic Media instead of always
 * loading the full-resolution original.
 *
 * Dynamic Media image-serving parameters used:
 *   wid  – rendered pixel width
 *   fmt  – image format (webp | jpeg | png)
 *   qlt  – quality (1–100)
 */

/**
 * Pixel widths offered per logical size bucket used in srcset strings.
 * These correspond to the breakpoints used by the EDS design system:
 *   mobile  ≤ 480 px   → 400 / 800 (1x / 2x)
 *   tablet  ≤ 1024 px  → 600 / 1200
 *   desktop > 1024 px  → 800 / 1600
 *   kiosk               → 600 / 1200
 *   digital-menu-board  → 800 / 1600
 */
const DEVICE_IMAGE_WIDTHS = {
  mobile: 400,
  tablet: 600,
  desktop: 800,
  kiosk: 600,
  'digital-menu-board': 800,
};

const DEFAULT_IMAGE_WIDTH = 800;

/**
 * Append Adobe Dynamic Media query parameters to an image URL.
 *
 * Returns the original string unchanged when it cannot be parsed as an
 * absolute URL (e.g. relative paths or placeholder strings used in tests).
 *
 * @param {string} imageUrl  - Absolute Dynamic Media image URL
 * @param {number} width     - Desired pixel width
 * @param {object} [options]
 * @param {string} [options.format='webp'] - Output format: webp | jpeg | png
 * @param {number} [options.quality=85]    - Quality level (1–100)
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
 * Build a `srcset` string with 1× and 2× renditions from Adobe Dynamic Media.
 *
 * @param {string} imageUrl        - Absolute Dynamic Media image URL
 * @param {number} width           - Base (1×) pixel width
 * @param {string} [format='webp'] - Image format for all srcset entries
 * @returns {string}  e.g. "https://…?wid=400&fmt=webp 400w, https://…?wid=800&fmt=webp 800w"
 */
export function buildDynamicMediaSrcset(imageUrl, width, format = 'webp') {
  if (!imageUrl) return '';
  const w1x = buildDynamicMediaUrl(imageUrl, width, { format });
  const w2x = buildDynamicMediaUrl(imageUrl, width * 2, { format });
  return `${w1x} 1x, ${w2x} 2x`;
}

/**
 * Return the base (1×) image width for a given device type.
 *
 * @param {string} deviceType
 * @returns {number}
 */
export function getImageWidthForDevice(deviceType) {
  return DEVICE_IMAGE_WIDTHS[deviceType] ?? DEFAULT_IMAGE_WIDTH;
}
