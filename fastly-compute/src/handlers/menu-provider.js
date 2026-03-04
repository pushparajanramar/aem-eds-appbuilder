/**
 * Menu Provider Handler — Fastly Compute edge function
 *
 * Returns EDS-compatible HTML block markup for the /menu overlay route.
 * Device-aware: uses X-Device-Type (set by Fastly VCL) to adjust column
 * count and image sizes.
 */

import { getMarketConfig } from '../shared/market-config.js';
import { safeUrl, buildDynamicMediaUrl, buildDynamicMediaSrcset } from '../shared/url-utils.js';
import { getDeviceType, getDeviceLayout, isHeadless } from '../shared/device-utils.js';
import { escapeHtml } from '../shared/html-utils.js';
import { logRequest, logError } from '../shared/datalog.js';

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
 *
 * @param {Array} items
 * @param {{ columns: number, imageWidth: number, fontSize: string, touch: boolean }} layout
 * @param {string} deviceType
 * @returns {string}
 */
export function renderMenuHTML(items, layout = { columns: 3, imageWidth: 800, fontSize: 'base', touch: false }, deviceType = 'desktop') {
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
        <source type="image/webp" srcset="${escapeHtml(buildDynamicMediaSrcset(item.imageUrl, layout.imageWidth))}" sizes="(max-width: 480px) ${Math.round(layout.imageWidth * 0.5)}px, ${layout.imageWidth}px">
        <img src="${escapeHtml(buildDynamicMediaUrl(item.imageUrl, layout.imageWidth, { format: 'jpeg' }))}" alt="${escapeHtml(item.title)}" loading="lazy" decoding="async" width="${layout.imageWidth}">
      </picture></div></div>` : ''}
    </div>`,
    )
    .join('\n');

  return `<div class="menu-grid" data-device="${escapeHtml(deviceType)}" data-columns="${layout.columns}" data-image-width="${layout.imageWidth}" data-font-size="${escapeHtml(layout.fontSize)}">\n${cards}\n</div>`;
}

/**
 * Handle menu-provider request.
 *
 * @param {Request} req
 * @returns {Promise<Response>}
 */
export async function handleMenuProvider(req) {
  const url = new URL(req.url);
  const market = url.searchParams.get('market') || 'us';
  const category = url.searchParams.get('category') || 'drinks';
  const { edsHost, locale } = getMarketConfig(market);
  const deviceType = getDeviceType(req);
  const layout = getDeviceLayout(deviceType);

  logRequest('menu-provider', req, market);

  try {
    const items = await fetchMenuItems(edsHost, category, locale);

    if (isHeadless(deviceType)) {
      return new Response(JSON.stringify({ market, category, locale, items }), {
        headers: {
          'content-type': 'application/json',
          'vary': 'X-Device-Type',
        },
      });
    }

    const body = renderMenuHTML(items, layout, deviceType);

    return new Response(body, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'vary': 'X-Device-Type',
      },
    });
  } catch (err) {
    console.error('menu-provider error:', err);
    logError('menu-provider', req, market, err, 500);
    return new Response('<p class="error">Unable to load menu. Please try again later.</p>', {
      status: 500,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }
}
