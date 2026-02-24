/**
 * Menu Provider Action — BYOM data-provider
 *
 * Returns EDS-compatible HTML block markup for the /menu overlay route.
 * RULE 5: market-aware, returns text/html with valid EDS block markup.
 * RULE 6: route must exist in site-config.json overlays.
 */

const { Core } = require('@adobe/aio-sdk');
const { getMarketConfig } = require('../shared/market-config');
const { safeUrl } = require('../shared/url-utils');

/**
 * Fetch menu items from the upstream product API.
 *
 * @param {string} edsHost
 * @param {string} category
 * @param {string} locale
 * @returns {Promise<Array>}
 */
async function fetchMenuItems(edsHost, category, locale) {
  const url = `https://${edsHost}/menu-data/${locale}/${category}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Upstream menu fetch failed: ${res.status}`);
  const { data } = await res.json();
  return Array.isArray(data) ? data : [];
}

/**
 * Render menu items as EDS block HTML.
 * Block class names MUST exactly match the block directory name (menu-item).
 *
 * @param {Array} items
 * @returns {string}
 */
function renderMenuHTML(items) {
  if (!items.length) {
    return '<p class="menu-empty">No items available.</p>';
  }

  const cards = items
    .map(
      (item) => `
    <div class="menu-item">
      <div><div><a href="${escapeHtml(safeUrl(item.cfPath))}">${escapeHtml(item.title)}</a></div></div>
      <div><div>${escapeHtml(item.description || '')}</div></div>
      <div><div>${escapeHtml(item.price || '')}</div></div>
      <div><div>item-id</div><div>${escapeHtml(item.id)}</div></div>
      <div><div>category</div><div>${escapeHtml(item.category || 'drinks')}</div></div>
    </div>`,
    )
    .join('\n');

  return `<div class="menu-grid">\n${cards}\n</div>`;
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
 * @param {object} params - Adobe I/O Runtime action params
 * @param {string} [params.market='us']
 * @param {string} [params.category='drinks']
 * @param {string} [params.LOG_LEVEL='info']
 * @returns {Promise<{statusCode: number, headers: object, body: string}>}
 */
async function main(params) {
  const logger = Core.Logger('menu-provider', { level: params.LOG_LEVEL || 'info' });

  const market = params.market || 'us';
  const category = params.category || 'drinks';
  const { edsHost, locale } = getMarketConfig(market);

  logger.info(`menu-provider: market=${market}, category=${category}, host=${edsHost}`);

  try {
    const items = await fetchMenuItems(edsHost, category, locale);
    const body = renderMenuHTML(items);

    return {
      statusCode: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
      body,
    };
  } catch (err) {
    logger.error('menu-provider error:', err);
    return {
      statusCode: 500,
      headers: { 'content-type': 'text/html; charset=utf-8' },
      body: '<p class="error">Unable to load menu. Please try again later.</p>',
    };
  }
}

module.exports = { main };
