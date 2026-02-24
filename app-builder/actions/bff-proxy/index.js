/**
 * BFF Proxy Action — Secure allowlisted proxy for internal BFF modules.
 *
 * Routes requests to /bff/proxy/{module}/... endpoints after validating
 * the module name against a strict allowlist and stripping path-traversal
 * sequences.  This prevents the class of attack that historically allowed
 * ../ traversal through BFF proxies to reach internal services and leak
 * millions of account records.
 *
 * Covered endpoints:
 *   GET  /bff/proxy/stream/v1/me/streamItems/...  (rewards / activity feed)
 *   GET  /bff/proxy/.../search/v1/Accounts        (proxied account search)
 *   GET  /bff/proxy/.../search/v1/Addresses       (proxied address lookup)
 *   Various /bff/proxy/{module}/... routes
 *
 * RULE 5: market-aware action shape.
 * Requires authentication (require-adobe-auth: true).
 */

const { Core } = require('@adobe/aio-sdk');
const { getMarketConfig } = require('../shared/market-config');
const { sanitizeBffModule } = require('../shared/url-utils');

/**
 * Strip any path-traversal sequences from a sub-path segment.
 * Removes .., ., and leading slashes so they cannot be used to escape
 * the module's path space.
 * Input segments are percent-encoded without prior decoding to prevent
 * double-encoding bypass (e.g. %2F must not be collapsed into a separator).
 *
 * @param {string} subpath
 * @returns {string}
 */
function sanitizeSubpath(subpath) {
  if (!subpath) return '';
  // Split on literal forward or back-slashes only; do NOT decode first,
  // so an attacker cannot smuggle path separators via %2F / %5C.
  return String(subpath)
    .split(/[/\\]+/)
    .filter((seg) => seg !== '' && seg !== '.' && seg !== '..')
    .map((seg) => encodeURIComponent(seg))
    .join('/');
}

/**
 * Forward a request to the upstream BFF proxy.
 *
 * @param {string} edsHost
 * @param {string} module      - Validated module name from the allowlist
 * @param {string} subpath     - Sanitised sub-path within the module
 * @param {string} method      - HTTP method
 * @param {string|null} body   - Request body (for POST/PUT)
 * @param {string} accessToken - Bearer token for the authenticated user
 * @returns {Promise<{status: number, data: unknown}>}
 */
async function forwardToBff(edsHost, module, subpath, method, body, accessToken) {
  const path = subpath ? `${module}/${subpath}` : module;
  const url = `https://${edsHost}/bff/proxy/${path}`;
  const init = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  };
  if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  const res = await fetch(url, init);
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

/**
 * Main action entry point.
 *
 * @param {object} params
 * @param {string} [params.market='us']
 * @param {string} params.module    - BFF module name (must be in allowlist)
 * @param {string} [params.subpath] - Sub-path within the module
 * @param {string} [params.method='GET'] - HTTP method to forward
 * @param {string} [params.body]    - Request body for POST/PUT methods
 * @param {string} [params.LOG_LEVEL='info']
 * @returns {Promise<{statusCode: number, headers: object, body: object}>}
 */
async function main(params) {
  const logger = Core.Logger('bff-proxy', { level: params.LOG_LEVEL || 'info' });

  const market = params.market || 'us';
  // Extract access token exclusively from the Authorization header injected by
  // Adobe I/O Runtime.  Do not fall back to a body/query param to prevent
  // token confusion attacks.
  const accessToken = params.__ow_headers?.authorization?.replace(/^Bearer\s+/i, '');

  if (!accessToken) {
    return { statusCode: 401, body: { error: 'Authentication required.' } };
  }

  const rawModule = params.module;
  const rawSubpath = params.subpath || '';
  const method = (params.method || 'GET').toUpperCase();
  const reqBody = params.body || null;

  // Validate module against the allowlist
  const module = sanitizeBffModule(rawModule);
  if (!module) {
    logger.warn(`bff-proxy: rejected module="${rawModule}"`);
    return {
      statusCode: 400,
      body: { error: `Module "${rawModule}" is not permitted.` },
    };
  }

  // Sanitise sub-path to prevent traversal
  const subpath = sanitizeSubpath(rawSubpath);

  const { edsHost } = getMarketConfig(market);
  logger.info(`bff-proxy: market=${market}, module=${module}, subpath=${subpath}, method=${method}`);

  try {
    const { status, data } = await forwardToBff(edsHost, module, subpath, method, reqBody, accessToken);
    return {
      statusCode: status,
      headers: { 'content-type': 'application/json' },
      body: data,
    };
  } catch (err) {
    logger.error('bff-proxy error:', err);
    return {
      statusCode: 502,
      body: { error: 'Upstream BFF proxy request failed.' },
    };
  }
}

module.exports = { main };
