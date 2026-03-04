/**
 * Store Provider Handler — Fastly Compute edge function
 *
 * Returns EDS-compatible HTML block markup for the /stores overlay route.
 * Proxies to /bff/locations with optional lat/lng/place params.
 */

import { getMarketConfig } from '../shared/market-config.js';
import { getDeviceType, getDeviceLayout, isHeadless } from '../shared/device-utils.js';
import { escapeHtml } from '../shared/html-utils.js';
import { logRequest } from '../shared/datalog.js';

/**
 * Fetch store locations from the BFF locations endpoint.
 *
 * @param {string} edsHost
 * @param {string} locale
 * @param {object} [opts]
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
 *
 * @param {Array} stores
 * @param {{ columns: number, imageWidth: number, fontSize: string, touch: boolean }} layout
 * @param {string} deviceType
 * @returns {string}
 */
export function renderStoreHTML(stores, layout = { columns: 3, imageWidth: 800, fontSize: 'base', touch: false }, deviceType = 'desktop') {
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
 * Handle store-provider request.
 *
 * @param {Request} req
 * @returns {Promise<Response>}
 */
export async function handleStoreProvider(req) {
  const url = new URL(req.url);
  const market = url.searchParams.get('market') || 'us';
  const city = url.searchParams.get('city') || undefined;
  const lat = url.searchParams.get('lat') || undefined;
  const lng = url.searchParams.get('lng') || undefined;
  const place = url.searchParams.get('place') || undefined;
  const { edsHost, locale } = getMarketConfig(market);
  const deviceType = getDeviceType(req);
  const layout = getDeviceLayout(deviceType);

  logRequest('store-provider', req, market);

  try {
    const stores = await fetchStores(edsHost, locale, { city, lat, lng, place });

    if (isHeadless(deviceType)) {
      return new Response(JSON.stringify({ market, locale, stores }), {
        headers: {
          'content-type': 'application/json',
          'vary': 'X-Device-Type',
        },
      });
    }

    const body = renderStoreHTML(stores, layout, deviceType);

    return new Response(body, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'vary': 'X-Device-Type',
      },
    });
  } catch (err) {
    console.error('store-provider error:', err);
    return new Response('<p class="error">Unable to load stores. Please try again later.</p>', {
      status: 500,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }
}
