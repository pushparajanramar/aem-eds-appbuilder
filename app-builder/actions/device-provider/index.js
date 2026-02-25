/**
 * Device Provider Action — BYOM device-aware content adapter
 *
 * Returns a JSON payload describing the resolved device type and layout hints
 * so that EDS pages and App Builder actions can adapt their output without
 * performing UA sniffing in the browser.
 *
 * The X-Device-Type header is set by Fastly VCL (fastly/vcl/device-detection.vcl)
 * before the request reaches this action.  The action also supports:
 *   - Explicit `deviceType` param (for tests / direct invocation)
 *   - `?device=` query-parameter override (mirrors the Fastly VCL override)
 *
 * Supported device types: mobile | tablet | desktop | kiosk | digital-menu-board
 * RULE 5: market-aware action shape.
 */

const { Core } = require('@adobe/aio-sdk');
const { getMarketConfig } = require('../shared/market-config');
const { getDeviceType, getDeviceLayout } = require('../shared/device-utils');

/**
 * Build the EDS-compatible HTML snippet that embeds device metadata.
 * The snippet is injected into the page <head> so that CSS and JS can
 * use the data-device attribute on <body> without an extra round-trip.
 *
 * @param {string} deviceType
 * @param {{ columns: number, imageWidth: number, fontSize: string, touch: boolean }} layout
 * @param {string} market
 * @returns {string}
 */
function renderDeviceMetaHTML(deviceType, layout, market) {
  return `<meta name="x-device-type" content="${deviceType}">
<meta name="x-device-columns" content="${layout.columns}">
<meta name="x-device-image-width" content="${layout.imageWidth}">
<meta name="x-device-font-size" content="${layout.fontSize}">
<meta name="x-device-touch" content="${layout.touch}">
<meta name="x-market" content="${market}">
<script>
(function(){
  var d=document.documentElement;
  d.setAttribute('data-device','${deviceType}');
  d.setAttribute('data-market','${market}');
  if(${layout.touch}){d.classList.add('touch-device');}
})();
</script>`;
}

/**
 * Main action entry point.
 *
 * @param {object} params
 * @param {string} [params.market='us']
 * @param {string} [params.deviceType]         - Explicit override (optional)
 * @param {string} [params.__ow_query]          - Raw query string from runtime
 * @param {object} [params.__ow_headers]        - Request headers from runtime
 * @param {string} [params.LOG_LEVEL='info']
 * @returns {Promise<{statusCode: number, headers: object, body: string|object}>}
 */
async function main(params) {
  const logger = Core.Logger('device-provider', { level: params.LOG_LEVEL || 'info' });

  const market = params.market || 'us';
  const { locale } = getMarketConfig(market);
  const deviceType = getDeviceType(params);
  const layout = getDeviceLayout(deviceType);

  logger.info(`device-provider: market=${market}, device=${deviceType}, locale=${locale}`);

  // Accept header determines response format:
  //   text/html → <meta> snippet for <head> injection
  //   *         → JSON payload for programmatic consumption
  const accept = params?.__ow_headers?.accept || '';
  if (accept.includes('text/html')) {
    return {
      statusCode: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=0',
        'vary': 'X-Device-Type',
      },
      body: renderDeviceMetaHTML(deviceType, layout, market),
    };
  }

  return {
    statusCode: 200,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'public, max-age=0',
      'vary': 'X-Device-Type',
    },
    body: {
      deviceType,
      layout,
      market,
      locale,
    },
  };
}

module.exports = { main, renderDeviceMetaHTML };
