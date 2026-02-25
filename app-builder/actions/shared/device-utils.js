/**
 * Device Detection Utilities for App Builder Actions
 *
 * Parses and validates the X-Device-Type header set by Fastly VCL.
 * Provides layout hints that actions use to render device-appropriate HTML.
 *
 * Supported device types (mirror the Fastly VCL values):
 *   mobile             – smartphones
 *   tablet             – tablets
 *   desktop            – laptops / desktops (default)
 *   kiosk              – touch kiosks
 *   digital-menu-board – in-restaurant digital signage
 *   headless           – API / JSON consumers (returns structured JSON instead of HTML)
 */

/**
 * Exhaustive set of device type values recognised by this service.
 * Must stay in sync with the values in fastly/vcl/device-detection.vcl.
 */
const DEVICE_TYPES = new Set(['mobile', 'tablet', 'desktop', 'kiosk', 'digital-menu-board', 'headless']);

const DEFAULT_DEVICE_TYPE = 'desktop';

/**
 * Layout configuration keyed by device type.
 * Actions use these hints to adjust rendered HTML (column counts, image sizes, etc.).
 * The headless layout uses desktop dimensions as a neutral baseline since the
 * consumer drives its own presentation.
 *
 * @type {Record<string, {columns: number, imageWidth: number, fontSize: string, touch: boolean}>}
 */
const DEVICE_LAYOUT = {
  mobile: {
    columns: 1,
    imageWidth: 400,
    fontSize: 'base',
    touch: true,
  },
  tablet: {
    columns: 2,
    imageWidth: 600,
    fontSize: 'base',
    touch: true,
  },
  desktop: {
    columns: 3,
    imageWidth: 800,
    fontSize: 'base',
    touch: false,
  },
  kiosk: {
    columns: 2,
    imageWidth: 600,
    fontSize: 'large',
    touch: true,
  },
  'digital-menu-board': {
    columns: 4,
    imageWidth: 800,
    fontSize: 'xlarge',
    touch: false,
  },
  headless: {
    columns: 3,
    imageWidth: 800,
    fontSize: 'base',
    touch: false,
  },
};

/**
 * Extract and validate the device type from Adobe I/O Runtime action params.
 *
 * Resolution order:
 *   1. `params.__ow_headers['x-device-type']`  – set by Fastly VCL
 *   2. `params.deviceType`                      – explicit param (e.g. from tests)
 *   3. `params.__ow_query` ?device=             – query-parameter fallback
 *   4. DEFAULT_DEVICE_TYPE ('desktop')
 *
 * The resolved value is always validated against DEVICE_TYPES.  Invalid
 * values fall back to 'desktop' to prevent unexpected rendering behaviour.
 *
 * @param {object} params - Adobe I/O Runtime action params object
 * @returns {string} Validated device type
 */
function getDeviceType(params) {
  // 1. Fastly-injected header (preferred)
  const headerValue = params?.__ow_headers?.['x-device-type'];
  if (headerValue && DEVICE_TYPES.has(headerValue)) {
    return headerValue;
  }

  // 2. Explicit action param (useful in tests and direct invocations)
  const paramValue = params?.deviceType;
  if (paramValue && DEVICE_TYPES.has(paramValue)) {
    return paramValue;
  }

  // 3. Query-parameter (?device=…) forwarded by the runtime
  const queryString = params?.__ow_query || '';
  const match = queryString.match(/(?:^|&)device=([^&]+)/);
  if (match && DEVICE_TYPES.has(match[1])) {
    return match[1];
  }

  return DEFAULT_DEVICE_TYPE;
}

/**
 * Return the layout configuration for the given device type.
 *
 * @param {string} deviceType - Validated device type string
 * @returns {{ columns: number, imageWidth: number, fontSize: string, touch: boolean }}
 */
function getDeviceLayout(deviceType) {
  return DEVICE_LAYOUT[deviceType] || DEVICE_LAYOUT[DEFAULT_DEVICE_TYPE];
}

/**
 * Return true when the device type is 'headless'.
 * Headless callers receive a raw JSON response instead of rendered HTML.
 *
 * @param {string} deviceType
 * @returns {boolean}
 */
function isHeadless(deviceType) {
  return deviceType === 'headless';
}

module.exports = {
  DEVICE_TYPES,
  DEFAULT_DEVICE_TYPE,
  DEVICE_LAYOUT,
  getDeviceType,
  getDeviceLayout,
  isHeadless,
};
