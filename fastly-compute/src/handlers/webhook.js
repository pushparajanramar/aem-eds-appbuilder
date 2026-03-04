/**
 * Webhook Handler — Fastly Compute edge function
 *
 * Handles incoming webhooks from AEM Author for cache invalidation
 * and index update triggers across all EDS markets.
 */

import { getMarketConfig } from '../shared/market-config.js';
import { logRequest, logError } from '../shared/datalog.js';

const SUPPORTED_EVENTS = ['publish', 'unpublish', 'delete'];

/**
 * Trigger an EDS cache purge / reindex for the given path and market.
 *
 * @param {string} edsHost
 * @param {string} path
 * @param {'publish'|'unpublish'|'delete'} event
 * @returns {Promise<void>}
 */
async function triggerEDSUpdate(edsHost, path, event) {
  const method = event === 'publish' ? 'POST' : 'DELETE';
  const url = `https://admin.hlx.page/${event}/org/repo/main${path}`;
  const res = await fetch(url, { method });
  if (!res.ok) {
    throw new Error(`EDS admin API call failed (${method} ${url}): ${res.status}`);
  }
}

/**
 * Handle webhook request.
 *
 * @param {Request} req
 * @returns {Promise<Response>}
 */
export async function handleWebhook(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const market = body.market || 'us';
  const path = body.path;
  const event = body.event;

  logRequest('webhook', req, market);

  if (!path) {
    logError('webhook', req, market, 'Missing required param: path', 400);
    return new Response(JSON.stringify({ error: 'Missing required param: path' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (!SUPPORTED_EVENTS.includes(event)) {
    logError('webhook', req, market, `Unsupported event: ${event}`, 400);
    return new Response(
      JSON.stringify({ error: `Unsupported event: ${event}. Must be one of: ${SUPPORTED_EVENTS.join(', ')}` }),
      { status: 400, headers: { 'content-type': 'application/json' } },
    );
  }

  const { edsHost } = getMarketConfig(market);

  try {
    await triggerEDSUpdate(edsHost, path, event);
    return new Response(JSON.stringify({ result: 'ok', event, path, market, edsHost }), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    console.error('webhook error:', err);
    logError('webhook', req, market, err, 500);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
