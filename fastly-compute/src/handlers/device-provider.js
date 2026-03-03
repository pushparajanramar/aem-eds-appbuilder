/**
 * Device Provider Handler — Fastly Compute edge function
 *
 * Returns a JSON payload or HTML meta snippet describing the resolved
 * device type and layout hints.
 */

import { getMarketConfig } from '../shared/market-config.js';
import { getDeviceType, getDeviceLayout } from '../shared/device-utils.js';
import { logRequest } from '../shared/datalog.js';

/**
 * Build the EDS-compatible HTML snippet that embeds device metadata.
 *
 * @param {string} deviceType
 * @param {{ columns: number, imageWidth: number, fontSize: string, touch: boolean }} layout
 * @param {string} market
 * @returns {string}
 */
export function renderDeviceMetaHTML(deviceType, layout, market) {
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
 * Handle device-provider request.
 *
 * @param {Request} req
 * @returns {Promise<Response>}
 */
export async function handleDeviceProvider(req) {
  const url = new URL(req.url);
  const market = url.searchParams.get('market') || 'us';
  const { locale } = getMarketConfig(market);
  const deviceType = getDeviceType(req);
  const layout = getDeviceLayout(deviceType);

  logRequest('device-provider', req, market);

  // Accept header determines response format
  const accept = req.headers.get('accept') || '';
  if (accept.includes('text/html')) {
    return new Response(renderDeviceMetaHTML(deviceType, layout, market), {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=0',
        'vary': 'X-Device-Type',
      },
    });
  }

  return new Response(JSON.stringify({ deviceType, layout, market, locale }), {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'public, max-age=0',
      'vary': 'X-Device-Type',
    },
  });
}
