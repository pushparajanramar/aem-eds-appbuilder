/**
 * Rewards Provider Handler — Fastly Compute edge function
 *
 * Returns EDS-compatible HTML block markup for the /rewards overlay route.
 */

import { getMarketConfig } from '../shared/market-config.js';
import { safeUrl } from '../shared/url-utils.js';
import { getDeviceType, isHeadless } from '../shared/device-utils.js';
import { escapeHtml } from '../shared/html-utils.js';
import { logRequest, logError } from '../shared/datalog.js';

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
 *
 * @param {Array} rewards
 * @returns {string}
 */
export function renderRewardsHTML(rewards) {
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
 * Handle rewards-provider request.
 *
 * @param {Request} req
 * @returns {Promise<Response>}
 */
export async function handleRewardsProvider(req) {
  const url = new URL(req.url);
  const market = url.searchParams.get('market') || 'us';
  const { edsHost, locale } = getMarketConfig(market);
  const deviceType = getDeviceType(req);

  logRequest('rewards-provider', req, market);

  try {
    const rewards = await fetchRewards(edsHost, locale);

    if (isHeadless(deviceType)) {
      return new Response(JSON.stringify({ market, locale, rewards }), {
        headers: {
          'content-type': 'application/json',
          'vary': 'X-Device-Type',
        },
      });
    }

    const body = renderRewardsHTML(rewards);

    return new Response(body, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'vary': 'X-Device-Type',
      },
    });
  } catch (err) {
    console.error('rewards-provider error:', err);
    logError('rewards-provider', req, market, err, 500);
    return new Response('<p class="error">Unable to load rewards. Please try again later.</p>', {
      status: 500,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }
}
