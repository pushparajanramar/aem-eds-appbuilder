/**
 * Tests for shared/market-config.js (App Builder CJS version)
 */

const {
  MARKET_CONFIG,
  getMarketConfig,
  CONTENT_SOURCE_AEM,
  CONTENT_SOURCE_DA,
} = require('../actions/shared/market-config');

describe('market-config', () => {
  it('returns US config for "us"', () => {
    const config = getMarketConfig('us');
    expect(config.edsHost).toBe('main--qsr-us--org.aem.live');
    expect(config.locale).toBe('en-US');
    expect(config.currency).toBe('USD');
  });

  it('returns UK config for "uk"', () => {
    const config = getMarketConfig('uk');
    expect(config.edsHost).toBe('main--qsr-uk--org.aem.live');
    expect(config.locale).toBe('en-GB');
    expect(config.currency).toBe('GBP');
  });

  it('returns JP config for "jp"', () => {
    const config = getMarketConfig('jp');
    expect(config.edsHost).toBe('main--qsr-jp--org.aem.live');
    expect(config.locale).toBe('ja-JP');
    expect(config.currency).toBe('JPY');
  });

  it('falls back to US for unknown market', () => {
    const config = getMarketConfig('xx');
    expect(config.edsHost).toBe(MARKET_CONFIG.us.edsHost);
    expect(config.locale).toBe(MARKET_CONFIG.us.locale);
  });

  describe('content source switching', () => {
    it('defaults to AEM content source when no contentSource is provided', () => {
      const config = getMarketConfig('us');
      expect(config.edsHost).toBe('main--qsr-us--org.aem.live');
      expect(config.contentSource).toBe(CONTENT_SOURCE_AEM);
    });

    it('uses AEM host when contentSource is "aem"', () => {
      const config = getMarketConfig('us', 'aem');
      expect(config.edsHost).toBe('main--qsr-us--org.aem.live');
      expect(config.contentSource).toBe('aem');
    });

    it('uses DA.live host when contentSource is "da"', () => {
      const config = getMarketConfig('us', 'da');
      expect(config.edsHost).toBe('main--qsr-us--org.da.live');
      expect(config.contentSource).toBe('da');
    });

    it('switches UK market to DA.live', () => {
      const config = getMarketConfig('uk', 'da');
      expect(config.edsHost).toBe('main--qsr-uk--org.da.live');
      expect(config.contentSource).toBe('da');
    });

    it('switches JP market to DA.live', () => {
      const config = getMarketConfig('jp', 'da');
      expect(config.edsHost).toBe('main--qsr-jp--org.da.live');
      expect(config.contentSource).toBe('da');
    });

    it('preserves daHost in returned config', () => {
      const config = getMarketConfig('us', 'aem');
      expect(config.daHost).toBe('main--qsr-us--org.da.live');
    });

    it('falls back to AEM for unrecognised contentSource value', () => {
      const config = getMarketConfig('us', 'invalid');
      expect(config.edsHost).toBe('main--qsr-us--org.aem.live');
      expect(config.contentSource).toBe('aem');
    });

    it('falls back to AEM when contentSource is undefined', () => {
      const config = getMarketConfig('us', undefined);
      expect(config.edsHost).toBe('main--qsr-us--org.aem.live');
      expect(config.contentSource).toBe('aem');
    });

    it('does not mutate MARKET_CONFIG when switching source', () => {
      getMarketConfig('us', 'da');
      expect(MARKET_CONFIG.us.edsHost).toBe('main--qsr-us--org.aem.live');
    });
  });

  describe('exported constants', () => {
    it('exports CONTENT_SOURCE_AEM as "aem"', () => {
      expect(CONTENT_SOURCE_AEM).toBe('aem');
    });

    it('exports CONTENT_SOURCE_DA as "da"', () => {
      expect(CONTENT_SOURCE_DA).toBe('da');
    });
  });
});
