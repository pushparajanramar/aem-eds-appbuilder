/**
 * Shared API Utilities for Svelte Web Components
 *
 * Provides typed fetch helpers for the Starbucks EDS component library.
 * Auth tokens are obtained from the auth module (in-memory only — RULE 3).
 * All data-fetching routes through the BFF layer (/bff/...) rather than
 * calling internal APIs directly.
 */

import { getAccessToken } from './auth.js';

const MARKET_BFF_BASE = {
  us: 'https://www.starbucks.com',
  uk: 'https://www.starbucks.co.uk',
  jp: 'https://www.starbucks.co.jp',
};

/**
 * Build common headers for API requests.
 *
 * @returns {HeadersInit}
 */
function buildHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = getAccessToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

/**
 * Generic JSON fetch wrapper with error handling.
 *
 * @param {string} url
 * @param {RequestInit} [init]
 * @returns {Promise<unknown>}
 */
async function apiFetch(url, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: { ...buildHeaders(), ...(init.headers || {}) },
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetch a product by ID for the given market using the BFF ordering endpoint.
 *
 * @param {string} productId
 * @param {string} [market='us']
 * @param {string} [itemType='product']
 * @returns {Promise<object>}
 */
export async function fetchProduct(productId, market = 'us', itemType = 'product') {
  const base = MARKET_BFF_BASE[market] || MARKET_BFF_BASE.us;
  return apiFetch(
    `${base}/bff/ordering/${encodeURIComponent(productId)}/${encodeURIComponent(itemType)}`,
  );
}

/**
 * Fetch a menu item by ID for the given market and category via the BFF ordering endpoint.
 *
 * @param {string} itemId
 * @param {string} [market='us']
 * @param {string} [category='drinks']
 * @returns {Promise<object>}
 */
export async function fetchMenuItem(itemId, market = 'us', category = 'drinks') {
  const base = MARKET_BFF_BASE[market] || MARKET_BFF_BASE.us;
  return apiFetch(
    `${base}/bff/ordering/${encodeURIComponent(itemId)}/${encodeURIComponent(category)}`,
  );
}

/**
 * Fetch nearby stores for the given market and coordinates via /bff/locations.
 *
 * @param {object} opts
 * @param {number} opts.lat
 * @param {number} opts.lng
 * @param {string} [opts.place]   - Alternative to lat/lng: place name or address
 * @param {string} [opts.market='us']
 * @param {number} [opts.radius=5] - Search radius in km
 * @returns {Promise<object[]>}
 */
export async function fetchNearbyStores({ lat, lng, place, market = 'us', radius = 5 }) {
  const base = MARKET_BFF_BASE[market] || MARKET_BFF_BASE.us;
  const params = new URLSearchParams({ radius: String(radius) });
  if (place) {
    params.set('place', place);
  } else {
    params.set('lat', String(lat));
    params.set('lng', String(lng));
  }
  return apiFetch(`${base}/bff/locations?${params}`);
}

/**
 * Fetch rewards for the authenticated user via /bff/proxy/rewards.
 *
 * @param {string} [market='us']
 * @returns {Promise<object>}
 */
export async function fetchRewards(market = 'us') {
  const base = MARKET_BFF_BASE[market] || MARKET_BFF_BASE.us;
  return apiFetch(`${base}/bff/proxy/rewards`);
}

/**
 * Fetch the authenticated user's profile via /bff/proxy/orchestra/get-user.
 * The BFF orchestration endpoint uses POST for this read operation because it
 * was designed to accept optional request-body filters while always requiring
 * an authenticated session — following the same pattern as all orchestra calls.
 *
 * @param {string} [market='us']
 * @returns {Promise<object>}
 */
export async function fetchUserProfile(market = 'us') {
  const base = MARKET_BFF_BASE[market] || MARKET_BFF_BASE.us;
  return apiFetch(`${base}/bff/proxy/orchestra/get-user`, { method: 'POST' });
}

/**
 * Fetch user stream/activity items (rewards, offers, activity feed)
 * via /bff/proxy/stream/v1/me/streamItems.
 *
 * @param {string} [market='us']
 * @param {number} [limit=20]
 * @returns {Promise<object[]>}
 */
export async function fetchStreamItems(market = 'us', limit = 20) {
  const base = MARKET_BFF_BASE[market] || MARKET_BFF_BASE.us;
  const params = new URLSearchParams({ limit: String(limit) });
  return apiFetch(`${base}/bff/proxy/stream/v1/me/streamItems?${params}`);
}
