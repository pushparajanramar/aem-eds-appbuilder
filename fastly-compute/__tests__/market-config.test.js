/**
 * Tests for shared/market-config.js (Fastly Compute ESM version)
 */

import { MARKET_CONFIG, getMarketConfig } from '../src/shared/market-config.js';

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
    expect(config).toEqual(MARKET_CONFIG.us);
  });
});
