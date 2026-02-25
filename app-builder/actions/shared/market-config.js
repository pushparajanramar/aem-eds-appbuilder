/**
 * Shared Market Configuration
 *
 * Centralised EDS host and locale settings for all App Builder actions.
 * RULE 5: required market-aware EDS host resolution.
 */

const MARKET_CONFIG = {
  us: {
    edsHost: 'main--qsr-us--org.aem.live',
    locale: 'en-US',
    currency: 'USD',
    timezone: 'America/Los_Angeles',
  },
  uk: {
    edsHost: 'main--qsr-uk--org.aem.live',
    locale: 'en-GB',
    currency: 'GBP',
    timezone: 'Europe/London',
  },
  jp: {
    edsHost: 'main--qsr-jp--org.aem.live',
    locale: 'ja-JP',
    currency: 'JPY',
    timezone: 'Asia/Tokyo',
  },
};

/**
 * Returns market configuration for the given market code.
 * Falls back to 'us' if the market is not found.
 *
 * @param {string} market - Market code: 'us' | 'uk' | 'jp'
 * @returns {{ edsHost: string, locale: string, currency: string, timezone: string }}
 */
function getMarketConfig(market) {
  return MARKET_CONFIG[market] || MARKET_CONFIG.us;
}

module.exports = { MARKET_CONFIG, getMarketConfig };
