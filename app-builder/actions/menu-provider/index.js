/**
 * Menu Provider Action — BYOM data-provider
 *
 * Returns EDS-compatible HTML block markup for the /menu overlay route.
 * Device-aware: uses X-Device-Type (set by Fastly VCL) to adjust column
 * count and image sizes for mobile, tablet, desktop, kiosk, and
 * digital-menu-board layouts.
 * RULE 5: market-aware, returns text/html with valid EDS block markup.
 * RULE 6: route must exist in site-config.json overlays.
 */

const { Core } = require('@adobe/aio-sdk');
const { getMarketConfig } = require('../shared/market-config');
const { safeUrl, buildDynamicMediaUrl } = require('../shared/url-utils');
const { getDeviceType, getDeviceLayout } = require('../shared/device-utils');
const { logRequest } = require('../shared/datalog');

/**
 * Fetch menu items from the BFF ordering menu endpoint.
 *
 * @param {string} edsHost
 * @param {string} category
 * @param {string} locale
 * @returns {Promise<Array>}
 */
async function fetchMenuItems(edsHost, category, locale) {
  const params = new URLSearchParams({ locale, category });
  const url = `https://${edsHost}/bff/ordering/menu?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Upstream menu fetch failed: ${res.status}`);
  const { data } = await res.json();
  return Array.isArray(data) ? data : [];
}

/**
 * Render menu items as EDS block HTML.
 * Block class names MUST exactly match the block directory name (menu-item).
 * Columns and image widths are adjusted based on the device layout.
 *
 * @param {Array} items
 * @param {{ columns: number, imageWidth: number, fontSize: string, touch: boolean }} layout
 * @param {string} deviceType
 * @returns {string}
 */
function renderMenuHTML(items, layout = { columns: 3, imageWidth: 800, fontSize: 'base', touch: false }, deviceType = 'desktop') {
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
      ${item.imageUrl ? `<div><div><picture>
        <source type="image/webp" srcset="${escapeHtml(buildDynamicMediaUrl(item.imageUrl, layout.imageWidth))} 1x, ${escapeHtml(buildDynamicMediaUrl(item.imageUrl, layout.imageWidth * 2))} 2x">
        <img src="${escapeHtml(buildDynamicMediaUrl(item.imageUrl, layout.imageWidth, { format: 'jpeg' }))}" alt="${escapeHtml(item.title)}" loading="lazy" width="${layout.imageWidth}">
      </picture></div></div>` : ''}
    </div>`,
    )
    .join('\n');

  return `<div class="menu-grid" data-device="${escapeHtml(deviceType)}" data-columns="${layout.columns}" data-image-width="${layout.imageWidth}" data-font-size="${escapeHtml(layout.fontSize)}">\n${cards}\n</div>`;
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
 * @param {string} [params.deviceType]        - Explicit device-type override
 * @param {object} [params.__ow_headers]       - Request headers from runtime
 * @param {string} [params.__ow_query]         - Raw query string from runtime
 * @param {string} [params.LOG_LEVEL='info']
 * @returns {Promise<{statusCode: number, headers: object, body: string}>}
 */
async function main(params) {
  const logger = Core.Logger('menu-provider', { level: params.LOG_LEVEL || 'info' });
  logRequest(logger, 'menu-provider', params);

  const market = params.market || 'us';
  const category = params.category || 'drinks';
  const { edsHost, locale } = getMarketConfig(market);
  const deviceType = getDeviceType(params);
  const layout = getDeviceLayout(deviceType);

  logger.info(`menu-provider: market=${market}, category=${category}, device=${deviceType}, host=${edsHost}`);

  try {
    const items = await fetchMenuItems(edsHost, category, locale);
    const body = renderMenuHTML(items, layout, deviceType);

    return {
      statusCode: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'vary': 'X-Device-Type',
      },
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

module.exports = { main, renderMenuHTML };
