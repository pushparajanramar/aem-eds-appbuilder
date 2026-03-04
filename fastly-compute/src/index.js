/**
 * Fastly Compute entry point — EDS Dynamic Blocks edge service.
 *
 * Single-service router that dispatches requests to the appropriate handler
 * based on the URL pathname. Replaces the per-action Adobe App Builder
 * deployment with a single Fastly Compute service using path-based routing.
 *
 * Endpoints:
 *   GET  /menu-provider      — Menu items (EDS HTML or JSON for headless)
 *   GET  /store-provider     — Store locations (EDS HTML or JSON)
 *   GET  /rewards-provider   — Rewards catalog (EDS HTML or JSON)
 *   GET  /user-provider      — User profile (EDS HTML, auth required)
 *   *    /bff-proxy          — BFF module proxy (JSON, auth required)
 *   GET  /device-provider    — Device type + layout hints (HTML or JSON)
 *   POST /webhook            — AEM cache invalidation webhook
 *   POST /sitemap-generator  — Sitemap XML generation + CDN push
 */

import { handleMenuProvider } from './handlers/menu-provider.js';
import { handleStoreProvider } from './handlers/store-provider.js';
import { handleRewardsProvider } from './handlers/rewards-provider.js';
import { handleUserProvider } from './handlers/user-provider.js';
import { handleBffProxy } from './handlers/bff-proxy.js';
import { handleDeviceProvider } from './handlers/device-provider.js';
import { handleWebhook } from './handlers/webhook.js';
import { handleSitemapGenerator } from './handlers/sitemap-generator.js';
import { logError } from './shared/datalog.js';

/**
 * Route map — pathname prefix → handler function.
 */
const routes = {
  '/menu-provider': handleMenuProvider,
  '/store-provider': handleStoreProvider,
  '/rewards-provider': handleRewardsProvider,
  '/user-provider': handleUserProvider,
  '/bff-proxy': handleBffProxy,
  '/device-provider': handleDeviceProvider,
  '/webhook': handleWebhook,
  '/sitemap-generator': handleSitemapGenerator,
};

/**
 * Add CORS headers to responses.
 * Required for DA Library Plugin cross-origin fetch calls.
 *
 * @param {Response} response
 * @param {Request} request
 * @returns {Response}
 */
function addCorsHeaders(response, request) {
  const origin = request.headers.get('origin') || '*';
  const headers = new Headers(response.headers);
  headers.set('access-control-allow-origin', origin);
  headers.set('access-control-allow-methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  headers.set('access-control-allow-headers', 'Content-Type, Authorization, X-Device-Type, X-Eds-Token');
  headers.set('access-control-max-age', '86400');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

/**
 * Main request handler.
 *
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handleRequest(request) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return addCorsHeaders(new Response(null, { status: 204 }), request);
  }

  const url = new URL(request.url);
  const pathname = url.pathname;

  // Find matching route
  for (const [prefix, handler] of Object.entries(routes)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      try {
        const response = await handler(request);
        return addCorsHeaders(response, request);
      } catch (err) {
        console.error(`Unhandled error in ${prefix}:`, err);
        logError(prefix.slice(1), request, 'unknown', err, 500);
        return addCorsHeaders(
          new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'content-type': 'application/json' },
          }),
          request,
        );
      }
    }
  }

  // Health check / root
  if (pathname === '/' || pathname === '/health') {
    return addCorsHeaders(
      new Response(JSON.stringify({ status: 'ok', service: 'eds-dynamic-blocks' }), {
        headers: { 'content-type': 'application/json' },
      }),
      request,
    );
  }

  return addCorsHeaders(
    new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    }),
    request,
  );
}
