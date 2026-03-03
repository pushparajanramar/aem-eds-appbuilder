/**
 * Device Detection Utilities for Fastly Compute handlers.
 *
 * Parses and validates the X-Device-Type header set by Fastly VCL.
 * Provides layout hints that handlers use to render device-appropriate HTML.
 *
 * Supported device types (mirror the Fastly VCL values):
 *   mobile             – smartphones
 *   tablet             – tablets
 *   desktop            – laptops / desktops (default)
 *   kiosk              – touch kiosks
 *   digital-menu-board – in-restaurant digital signage
 *   headless           – API / JSON consumers (returns structured JSON instead of HTML)
 */

export const DEVICE_TYPES = new Set(['mobile', 'tablet', 'desktop', 'kiosk', 'digital-menu-board', 'headless']);

export const DEFAULT_DEVICE_TYPE = 'desktop';

/**
 * Layout configuration keyed by device type.
 *
 * @type {Record<string, {columns: number, imageWidth: number, fontSize: string, touch: boolean}>}
 */
export const DEVICE_LAYOUT = {
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
 * Extract and validate the device type from a Fastly Compute Request.
 *
 * Resolution order:
 *   1. `X-Device-Type` request header – set by Fastly VCL
 *   2. `?device=` query-parameter override
 *   3. DEFAULT_DEVICE_TYPE ('desktop')
 *
 * @param {Request} req - Fetch API Request object
 * @returns {string} Validated device type
 */
export function getDeviceType(req) {
  // 1. Fastly-injected header (preferred)
  const headerValue = req.headers.get('x-device-type');
  if (headerValue && DEVICE_TYPES.has(headerValue)) {
    return headerValue;
  }

  // 2. Query-parameter (?device=…) override
  try {
    const url = new URL(req.url);
    const deviceParam = url.searchParams.get('device');
    if (deviceParam && DEVICE_TYPES.has(deviceParam)) {
      return deviceParam;
    }
  } catch {
    // ignore URL parse errors
  }

  return DEFAULT_DEVICE_TYPE;
}

/**
 * Return the layout configuration for the given device type.
 *
 * @param {string} deviceType - Validated device type string
 * @returns {{ columns: number, imageWidth: number, fontSize: string, touch: boolean }}
 */
export function getDeviceLayout(deviceType) {
  return DEVICE_LAYOUT[deviceType] || DEVICE_LAYOUT[DEFAULT_DEVICE_TYPE];
}

/**
 * Return true when the device type is 'headless'.
 *
 * @param {string} deviceType
 * @returns {boolean}
 */
export function isHeadless(deviceType) {
  return deviceType === 'headless';
}
