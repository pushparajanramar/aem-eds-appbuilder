/**
 * Shared API Utilities for Svelte Web Components
 *
 * Provides typed fetch helpers for the Starbucks EDS component library.
 * Auth tokens are obtained from the auth module (in-memory only — RULE 3).
 */

import { getAccessToken } from './auth.js';

const MARKET_API_BASE = {
  us: 'https://api.starbucks.com/v1',
  uk: 'https://api.starbucks.co.uk/v1',
  jp: 'https://api.starbucks.co.jp/v1',
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
 * Fetch a product by ID for the given market.
 *
 * @param {string} productId
 * @param {string} [market='us']
 * @returns {Promise<object>}
 */
export async function fetchProduct(productId, market = 'us') {
  const base = MARKET_API_BASE[market] || MARKET_API_BASE.us;
  return apiFetch(`${base}/products/${encodeURIComponent(productId)}`);
}

/**
 * Fetch a menu item by ID for the given market and category.
 *
 * @param {string} itemId
 * @param {string} [market='us']
 * @param {string} [category='drinks']
 * @returns {Promise<object>}
 */
export async function fetchMenuItem(itemId, market = 'us', category = 'drinks') {
  const base = MARKET_API_BASE[market] || MARKET_API_BASE.us;
  return apiFetch(
    `${base}/menu/${encodeURIComponent(category)}/${encodeURIComponent(itemId)}`,
  );
}

/**
 * Fetch nearby stores for the given market and coordinates.
 *
 * @param {object} opts
 * @param {number} opts.lat
 * @param {number} opts.lng
 * @param {string} [opts.market='us']
 * @param {number} [opts.radius=5]  - Search radius in km
 * @returns {Promise<object[]>}
 */
export async function fetchNearbyStores({ lat, lng, market = 'us', radius = 5 }) {
  const base = MARKET_API_BASE[market] || MARKET_API_BASE.us;
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng), radius: String(radius) });
  return apiFetch(`${base}/stores/nearby?${params}`);
}

/**
 * Fetch rewards for the authenticated user.
 *
 * @param {string} [market='us']
 * @returns {Promise<object>}
 */
export async function fetchRewards(market = 'us') {
  const base = MARKET_API_BASE[market] || MARKET_API_BASE.us;
  return apiFetch(`${base}/rewards`);
}
