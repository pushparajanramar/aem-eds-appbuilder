/**
 * Rewards Provider Action — BYOM data-provider
 *
 * Returns EDS-compatible HTML block markup for the /rewards overlay route.
 * RULE 5: market-aware, returns text/html with valid EDS block markup.
 * RULE 6: route must exist in site-config.json overlays.
 */

const { Core } = require('@adobe/aio-sdk');
const { getMarketConfig } = require('../shared/market-config');
const { safeUrl } = require('../shared/url-utils');

/**
 * Fetch rewards catalog from the upstream rewards API.
 *
 * @param {string} edsHost
 * @param {string} locale
 * @returns {Promise<Array>}
 */
async function fetchRewards(edsHost, locale) {
  const url = `https://${edsHost}/rewards-data/${locale}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Upstream rewards fetch failed: ${res.status}`);
  const { data } = await res.json();
  return Array.isArray(data) ? data : [];
}

/**
 * Render rewards as EDS block HTML.
 * Block class names MUST exactly match block directory names.
 *
 * @param {Array} rewards
 * @returns {string}
 */
function renderRewardsHTML(rewards) {
  if (!rewards.length) {
    return '<p class="rewards-empty">No rewards available at this time.</p>';
  }

  const items = rewards
    .map(
      (reward) => `
    <div class="promotion-banner">
      <div><div><picture><img src="${escapeHtml(safeUrl(reward.imageUrl || ''))}" alt="${escapeHtml(reward.title)}" /></picture></div></div>
      <div><div>${escapeHtml(reward.title)}</div></div>
      <div><div>${escapeHtml(reward.description || '')}</div></div>
      <div><div><a href="${escapeHtml(safeUrl(reward.ctaUrl || '/rewards'))}">${escapeHtml(reward.ctaText || 'Redeem')}</a></div></div>
    </div>`,
    )
    .join('\n');

  return `<div class="rewards-list">\n${items}\n</div>`;
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
  const logger = Core.Logger('rewards-provider', { level: params.LOG_LEVEL || 'info' });

  const market = params.market || 'us';
  const { edsHost, locale } = getMarketConfig(market);

  logger.info(`rewards-provider: market=${market}, host=${edsHost}`);

  try {
    const rewards = await fetchRewards(edsHost, locale);
    const body = renderRewardsHTML(rewards);

    return {
      statusCode: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
      body,
    };
  } catch (err) {
    logger.error('rewards-provider error:', err);
    return {
      statusCode: 500,
      headers: { 'content-type': 'text/html; charset=utf-8' },
      body: '<p class="error">Unable to load rewards. Please try again later.</p>',
    };
  }
}

module.exports = { main };
