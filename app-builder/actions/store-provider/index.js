/**
 * Store Provider Action — BYOM data-provider
 *
 * Returns EDS-compatible HTML block markup for the /stores overlay route.
 * Proxies to /bff/locations with optional lat/lng/place params for nearby-store search.
 * RULE 5: market-aware, returns text/html with valid EDS block markup.
 * RULE 6: route must exist in site-config.json overlays.
 */

const { Core } = require('@adobe/aio-sdk');
const { getMarketConfig } = require('../shared/market-config');
const { getDeviceType, getDeviceLayout } = require('../shared/device-utils');
const { logRequest } = require('../shared/datalog');

/**
 * Fetch store locations from the BFF locations endpoint.
 * Supports coordinate-based search (lat/lng) or place-name search.
 *
 * @param {string} edsHost
 * @param {string} locale
 * @param {object} [opts]
 * @param {string} [opts.city]
 * @param {number|string} [opts.lat]
 * @param {number|string} [opts.lng]
 * @param {string} [opts.place]
 * @returns {Promise<Array>}
 */
async function fetchStores(edsHost, locale, opts = {}) {
  const params = new URLSearchParams({ locale });
  const { city, lat, lng, place } = opts;
  if (city) params.set('city', city);
  if (place) params.set('place', String(place));
  if (lat !== undefined && lat !== null && lat !== '') params.set('lat', String(Number(lat)));
  if (lng !== undefined && lng !== null && lng !== '') params.set('lng', String(Number(lng)));
  const url = `https://${edsHost}/bff/locations?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Upstream store fetch failed: ${res.status}`);
  const { data } = await res.json();
  return Array.isArray(data) ? data : [];
}

/**
 * Render stores as EDS block HTML.
 * Block class names MUST exactly match block directory names.
 * Layout is adjusted based on the device type resolved from X-Device-Type CDN header.
 *
 * @param {Array} stores
 * @param {{ columns: number, imageWidth: number, fontSize: string, touch: boolean }} layout
 * @param {string} deviceType
 * @returns {string}
 */
function renderStoreHTML(stores, layout = { columns: 3, imageWidth: 800, fontSize: 'base', touch: false }, deviceType = 'desktop') {
  if (!stores.length) {
    return '<p class="stores-empty">No stores found in this area.</p>';
  }

  const items = stores
    .map(
      (store) => `
    <div class="store-locator">
      <div><div>${escapeHtml(store.name)}</div></div>
      <div><div>${escapeHtml(store.address)}</div></div>
      <div><div>${escapeHtml(store.city)}, ${escapeHtml(store.state || store.region || '')} ${escapeHtml(store.zip || store.postcode || '')}</div></div>
      <div><div>${escapeHtml(store.phone || '')}</div></div>
      <div><div>${escapeHtml(store.hours || '')}</div></div>
      <div><div>lat</div><div>${escapeHtml(String(store.lat || ''))}</div></div>
      <div><div>lng</div><div>${escapeHtml(String(store.lng || ''))}</div></div>
    </div>`,
    )
    .join('\n');

  return `<div class="stores-list" data-device="${escapeHtml(deviceType)}" data-columns="${layout.columns}">\n${items}\n</div>`;
}

/**
 * Escape HTML special characters to prevent XSS in rendered markup.
 *
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Main action entry point.
 *
 * @param {object} params
 * @param {string} [params.market='us']
 * @param {string} [params.city]
 * @param {number|string} [params.lat]   - Latitude for nearby-store search
 * @param {number|string} [params.lng]   - Longitude for nearby-store search
 * @param {string} [params.place]        - Place name for nearby-store search
 * @param {string} [params.deviceType]   - Explicit device-type override
 * @param {object} [params.__ow_headers] - Request headers from runtime (X-Device-Type set by Fastly VCL)
 * @param {string} [params.__ow_query]   - Raw query string from runtime
 * @param {string} [params.LOG_LEVEL='info']
 * @returns {Promise<{statusCode: number, headers: object, body: string}>}
 */
async function main(params) {
  const logger = Core.Logger('store-provider', { level: params.LOG_LEVEL || 'info' });
  logRequest(logger, 'store-provider', params);

  const market = params.market || 'us';
  const { city, lat, lng, place } = params;
  const { edsHost, locale } = getMarketConfig(market);
  const deviceType = getDeviceType(params);
  const layout = getDeviceLayout(deviceType);

  logger.info(`store-provider: market=${market}, city=${city || 'all'}, lat=${lat || ''}, lng=${lng || ''}, place=${place || ''}, device=${deviceType}, host=${edsHost}`);

  try {
    const stores = await fetchStores(edsHost, locale, { city, lat, lng, place });
    const body = renderStoreHTML(stores, layout, deviceType);

    return {
      statusCode: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'vary': 'X-Device-Type',
      },
      body,
    };
  } catch (err) {
    logger.error('store-provider error:', err);
    return {
      statusCode: 500,
      headers: { 'content-type': 'text/html; charset=utf-8' },
      body: '<p class="error">Unable to load stores. Please try again later.</p>',
    };
  }
}

module.exports = { main, renderStoreHTML };
