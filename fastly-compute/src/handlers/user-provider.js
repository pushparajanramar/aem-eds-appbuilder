/**
 * User Provider Handler — Fastly Compute edge function
 *
 * Proxies to /bff/proxy/orchestra/get-user to retrieve the authenticated
 * user's profile. Returns EDS-compatible HTML block markup.
 * Requires authentication via Authorization header.
 */

import { getMarketConfig } from '../shared/market-config.js';
import { escapeHtml } from '../shared/html-utils.js';
import { logRequest, logError } from '../shared/datalog.js';

/**
 * Fetch the authenticated user's profile from the BFF orchestra endpoint.
 *
 * @param {string} edsHost
 * @param {string} accessToken
 * @returns {Promise<object>}
 */
async function fetchUserProfile(edsHost, accessToken) {
  const url = `https://${edsHost}/bff/proxy/orchestra/get-user`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(`User profile fetch failed: ${res.status}`);
  return res.json();
}

/**
 * Render the user profile as EDS block HTML.
 *
 * @param {object} user
 * @returns {string}
 */
export function renderUserHTML(user) {
  if (!user) {
    return '<p class="user-empty">Unable to load profile.</p>';
  }

  const name = escapeHtml(user.displayName || user.firstName || 'Member');
  const email = escapeHtml(user.email || '');
  const stars = escapeHtml(String(user.loyaltyStars || user.stars || 0));
  const tier = escapeHtml(user.rewardsTier || user.tier || '');

  return `<div class="user-profile">
  <div><div>display-name</div><div>${name}</div></div>
  <div><div>email</div><div>${email}</div></div>
  <div><div>stars</div><div>${stars}</div></div>
  <div><div>tier</div><div>${tier}</div></div>
</div>`;
}

/**
 * Handle user-provider request.
 *
 * @param {Request} req
 * @returns {Promise<Response>}
 */
export async function handleUserProvider(req) {
  const url = new URL(req.url);
  const market = url.searchParams.get('market') || 'us';

  // Extract access token exclusively from the Authorization header.
  const authHeader = req.headers.get('authorization') || '';
  const accessToken = authHeader.replace(/^Bearer\s+/i, '');
  const { edsHost } = getMarketConfig(market);

  logRequest('user-provider', req, market);

  if (!accessToken) {
    logError('user-provider', req, market, 'Authentication required', 401);
    return new Response('<p class="error">Authentication required.</p>', {
      status: 401,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }

  try {
    const user = await fetchUserProfile(edsHost, accessToken);
    const body = renderUserHTML(user);

    return new Response(body, {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  } catch (err) {
    console.error('user-provider error:', err);
    logError('user-provider', req, market, err, 500);
    return new Response('<p class="error">Unable to load user profile. Please try again later.</p>', {
      status: 500,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }
}
