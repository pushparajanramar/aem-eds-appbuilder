/**
 * User Provider Action — BYOM data-provider
 *
 * Proxies to /bff/proxy/orchestra/get-user to retrieve the authenticated
 * user's profile, loyalty data, and account information.
 * Returns EDS-compatible HTML block markup for the /account overlay route.
 * RULE 5: market-aware, returns text/html with valid EDS block markup.
 * RULE 6: route must exist in site-config.json overlays.
 * Requires authentication (require-adobe-auth: true).
 */

const { Core } = require('@adobe/aio-sdk');
const { getMarketConfig } = require('../shared/market-config');
const { logRequest } = require('../shared/datalog');

/**
 * Fetch the authenticated user's profile from the BFF orchestra endpoint.
 *
 * @param {string} edsHost
 * @param {string} accessToken - Bearer token for the authenticated user
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
function renderUserHTML(user) {
  if (!user) {
    return '<p class="user-empty">Unable to load profile.</p>';
  }

  const name = escapeHtml(user.displayName || user.firstName || 'Member');
  const email = escapeHtml(user.email || '');
  const stars = escapeHtml(String(user.loyaltyStars || user.stars || 0));
  const tier = escapeHtml(user.rewardsTier || user.tier || '');

  return `
<div class="user-profile">
  <div><div>display-name</div><div>${name}</div></div>
  <div><div>email</div><div>${email}</div></div>
  <div><div>stars</div><div>${stars}</div></div>
  <div><div>tier</div><div>${tier}</div></div>
</div>`.trim();
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
 * @param {string} [params.LOG_LEVEL='info']
 * @returns {Promise<{statusCode: number, headers: object, body: string}>}
 */
async function main(params) {
  const logger = Core.Logger('user-provider', { level: params.LOG_LEVEL || 'info' });
  logRequest(logger, 'user-provider', params);

  const market = params.market || 'us';
  // Extract access token exclusively from the Authorization header injected by
  // Adobe I/O Runtime.  Do not fall back to a body/query param to prevent
  // token confusion attacks.
  const accessToken = params.__ow_headers?.authorization?.replace(/^Bearer\s+/i, '');
  const { edsHost } = getMarketConfig(market);

  if (!accessToken) {
    return {
      statusCode: 401,
      headers: { 'content-type': 'text/html; charset=utf-8' },
      body: '<p class="error">Authentication required.</p>',
    };
  }

  logger.info(`user-provider: market=${market}, host=${edsHost}`);

  try {
    const user = await fetchUserProfile(edsHost, accessToken);
    const body = renderUserHTML(user);

    return {
      statusCode: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
      body,
    };
  } catch (err) {
    logger.error('user-provider error:', err);
    return {
      statusCode: 500,
      headers: { 'content-type': 'text/html; charset=utf-8' },
      body: '<p class="error">Unable to load user profile. Please try again later.</p>',
    };
  }
}

module.exports = { main };
