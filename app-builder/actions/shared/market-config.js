/**
 * Shared Market Configuration
 *
 * Centralised EDS host and locale settings for all App Builder actions.
 * RULE 5: required market-aware EDS host resolution.
 *
 * Each market supports two content sources:
 *   - 'aem'  → AEM (JCR) as a Cloud Service  (default)
 *   - 'da'   → DA.live (Document Authoring)
 *
 * The active source is selected via the CONTENT_SOURCE action input
 * (or environment variable) and passed to getMarketConfig().
 */

const CONTENT_SOURCE_AEM = 'aem';
const CONTENT_SOURCE_DA = 'da';

const MARKET_CONFIG = {
  us: {
    edsHost: 'main--qsr-us--org.aem.live',
    daHost: 'main--qsr-us--org.da.live',
    locale: 'en-US',
    currency: 'USD',
    timezone: 'America/Los_Angeles',
  },
  uk: {
    edsHost: 'main--qsr-uk--org.aem.live',
    daHost: 'main--qsr-uk--org.da.live',
    locale: 'en-GB',
    currency: 'GBP',
    timezone: 'Europe/London',
  },
  jp: {
    edsHost: 'main--qsr-jp--org.aem.live',
    daHost: 'main--qsr-jp--org.da.live',
    locale: 'ja-JP',
    currency: 'JPY',
    timezone: 'Asia/Tokyo',
  },
};

/**
 * Returns market configuration for the given market code and content source.
 * Falls back to 'us' if the market is not found.
 * When contentSource is 'da', the returned edsHost is set to the DA.live host
 * instead of the default AEM host.
 *
 * @param {string} market - Market code: 'us' | 'uk' | 'jp'
 * @param {string} [contentSource='aem'] - Content source: 'aem' | 'da'
 * @returns {{ edsHost: string, daHost: string, locale: string, currency: string, timezone: string, contentSource: string }}
 */
function getMarketConfig(market, contentSource) {
  const config = MARKET_CONFIG[market] || MARKET_CONFIG.us;
  const source = contentSource === CONTENT_SOURCE_DA ? CONTENT_SOURCE_DA : CONTENT_SOURCE_AEM;
  return {
    ...config,
    edsHost: source === CONTENT_SOURCE_DA ? config.daHost : config.edsHost,
    contentSource: source,
  };
}

module.exports = { MARKET_CONFIG, getMarketConfig, CONTENT_SOURCE_AEM, CONTENT_SOURCE_DA };
