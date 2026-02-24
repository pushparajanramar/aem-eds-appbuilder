/**
 * Webhook Action
 *
 * Handles incoming webhooks from AEM Author for cache invalidation
 * and index update triggers across all EDS markets.
 * RULE 5: market-aware action shape.
 */

const { Core } = require('@adobe/aio-sdk');
const { getMarketConfig } = require('../shared/market-config');

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
 * Main action entry point.
 *
 * @param {object} params
 * @param {string} [params.market='us']
 * @param {string} params.path         - Content path that was modified
 * @param {string} params.event        - Webhook event: 'publish' | 'unpublish' | 'delete'
 * @param {string} [params.LOG_LEVEL='info']
 * @returns {Promise<{statusCode: number, body: object}>}
 */
async function main(params) {
  const logger = Core.Logger('webhook', { level: params.LOG_LEVEL || 'info' });

  const market = params.market || 'us';
  const path = params.path;
  const event = params.event;

  if (!path) {
    return { statusCode: 400, body: { error: 'Missing required param: path' } };
  }

  if (!SUPPORTED_EVENTS.includes(event)) {
    return {
      statusCode: 400,
      body: { error: `Unsupported event: ${event}. Must be one of: ${SUPPORTED_EVENTS.join(', ')}` },
    };
  }

  const { edsHost } = getMarketConfig(market);
  logger.info(`webhook: event=${event}, market=${market}, path=${path}, host=${edsHost}`);

  try {
    await triggerEDSUpdate(edsHost, path, event);
    return {
      statusCode: 200,
      body: { result: 'ok', event, path, market, edsHost },
    };
  } catch (err) {
    logger.error('webhook error:', err);
    return {
      statusCode: 500,
      body: { error: err.message },
    };
  }
}

module.exports = { main };
