/**
 * Store Provider Action — BYOM data-provider
 *
 * Returns EDS-compatible HTML block markup for the /stores overlay route.
 * RULE 5: market-aware, returns text/html with valid EDS block markup.
 * RULE 6: route must exist in site-config.json overlays.
 */

const { Core } = require('@adobe/aio-sdk');
const { getMarketConfig } = require('../shared/market-config');

/**
 * Fetch store locations from the upstream store locator API.
 *
 * @param {string} edsHost
 * @param {string} locale
 * @param {string} [city]
 * @returns {Promise<Array>}
 */
async function fetchStores(edsHost, locale, city) {
  const params = new URLSearchParams({ locale });
  if (city) params.set('city', city);
  const url = `https://${edsHost}/store-data?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Upstream store fetch failed: ${res.status}`);
  const { data } = await res.json();
  return Array.isArray(data) ? data : [];
}

/**
 * Render stores as EDS block HTML.
 * Block class names MUST exactly match block directory names.
 *
 * @param {Array} stores
 * @returns {string}
 */
function renderStoreHTML(stores) {
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

  return `<div class="stores-list">\n${items}\n</div>`;
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
 * @param {string} [params.LOG_LEVEL='info']
 * @returns {Promise<{statusCode: number, headers: object, body: string}>}
 */
async function main(params) {
  const logger = Core.Logger('store-provider', { level: params.LOG_LEVEL || 'info' });

  const market = params.market || 'us';
  const city = params.city;
  const { edsHost, locale } = getMarketConfig(market);

  logger.info(`store-provider: market=${market}, city=${city || 'all'}, host=${edsHost}`);

  try {
    const stores = await fetchStores(edsHost, locale, city);
    const body = renderStoreHTML(stores);

    return {
      statusCode: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
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

module.exports = { main };
