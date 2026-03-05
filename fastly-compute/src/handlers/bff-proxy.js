/**
 * BFF Proxy Handler — Fastly Compute edge function
 *
 * Secure allowlisted proxy for internal BFF modules.
 * Routes requests to /bff/proxy/{module}/... endpoints after validating
 * the module name against a strict allowlist and stripping path-traversal
 * sequences.
 * Requires authentication via Authorization header.
 */

import { getMarketConfig } from '../shared/market-config.js';
import { sanitizeBffModule } from '../shared/url-utils.js';
import { logRequest, logError } from '../shared/datalog.js';

/**
 * Strip any path-traversal sequences from a sub-path segment.
 *
 * @param {string} subpath
 * @returns {string}
 */
function sanitizeSubpath(subpath) {
  if (!subpath) return '';
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
 * @param {string} module
 * @param {string} subpath
 * @param {string} method
 * @param {string|null} body
 * @param {string} accessToken
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
 * Handle bff-proxy request.
 *
 * @param {Request} req
 * @returns {Promise<Response>}
 */
export async function handleBffProxy(req) {
  const url = new URL(req.url);
  const market = url.searchParams.get('market') || 'us';

  // Extract access token exclusively from the Authorization header.
  const authHeader = req.headers.get('authorization') || '';
  const accessToken = authHeader.replace(/^Bearer\s+/i, '');

  logRequest('bff-proxy', req, market);

  if (!accessToken) {
    logError('bff-proxy', req, market, 'Authentication required', 401);
    return new Response(JSON.stringify({ error: 'Authentication required.' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }

  const rawModule = url.searchParams.get('module') || '';
  const rawSubpath = url.searchParams.get('subpath') || '';
  const method = (url.searchParams.get('method') || req.method || 'GET').toUpperCase();

  // Validate module against the allowlist
  const module = sanitizeBffModule(rawModule);
  if (!module) {
    logError('bff-proxy', req, market, `Module "${rawModule}" is not permitted`, 400);
    return new Response(JSON.stringify({ error: `Module "${rawModule}" is not permitted.` }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  // Sanitise sub-path to prevent traversal
  const subpath = sanitizeSubpath(rawSubpath);
  const { edsHost } = getMarketConfig(market);

  let reqBody = null;
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    try {
      reqBody = await req.text();
    } catch {
      reqBody = null;
    }
  }

  try {
    const { status, data } = await forwardToBff(edsHost, module, subpath, method, reqBody, accessToken);
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    console.error('bff-proxy error:', err);
    logError('bff-proxy', req, market, err, 502);
    return new Response(JSON.stringify({ error: 'Upstream BFF proxy request failed.' }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }
}
