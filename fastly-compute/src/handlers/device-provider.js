/**
 * Device Provider Handler — Fastly Compute edge function
 *
 * Returns a JSON payload or HTML meta snippet describing the resolved
 * device type and layout hints.
 */

import { getMarketConfig } from '../shared/market-config.js';
import { getDeviceType, getDeviceLayout } from '../shared/device-utils.js';
import { escapeHtml } from '../shared/html-utils.js';
import { logRequest, logError } from '../shared/datalog.js';

/**
 * Build the EDS-compatible HTML snippet that embeds device metadata.
 *
 * @param {string} deviceType
 * @param {{ columns: number, imageWidth: number, fontSize: string, touch: boolean }} layout
 * @param {string} market
 * @returns {string}
 */
export function renderDeviceMetaHTML(deviceType, layout, market) {
  const safeDevice = escapeHtml(deviceType);
  const safeMarket = escapeHtml(market);
  return `<meta name="x-device-type" content="${safeDevice}">
<meta name="x-device-columns" content="${layout.columns}">
<meta name="x-device-image-width" content="${layout.imageWidth}">
<meta name="x-device-font-size" content="${escapeHtml(layout.fontSize)}">
<meta name="x-device-touch" content="${layout.touch}">
<meta name="x-market" content="${safeMarket}">
<script>
(function(){
  var d=document.documentElement;
  d.setAttribute('data-device','${safeDevice}');
  d.setAttribute('data-market','${safeMarket}');
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

  logRequest('device-provider', req, market);

  try {
    const { locale } = getMarketConfig(market);
    const deviceType = getDeviceType(req);
    const layout = getDeviceLayout(deviceType);

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
  } catch (err) {
    console.error('device-provider error:', err);
    logError('device-provider', req, market, err, 500);
    return new Response(JSON.stringify({ error: 'Unable to resolve device information.' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
