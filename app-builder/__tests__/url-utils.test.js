/**
 * Tests for shared/url-utils.js — buildDynamicMediaUrl
 */

const { safeUrl, sanitizeBffModule, buildDynamicMediaUrl } = require('../actions/shared/url-utils');

describe('url-utils', () => {
  describe('safeUrl', () => {
    it('returns empty string for falsy input', () => {
      expect(safeUrl('')).toBe('');
      expect(safeUrl(null)).toBe('');
      expect(safeUrl(undefined)).toBe('');
    });

    it('allows https URLs', () => {
      expect(safeUrl('https://example.com/path')).toBe('https://example.com/path');
    });

    it('allows http URLs', () => {
      expect(safeUrl('http://example.com/path')).toBe('http://example.com/path');
    });

    it('allows absolute paths', () => {
      expect(safeUrl('/content/images/foo')).toBe('/content/images/foo');
    });

    it('rejects javascript: URIs', () => {
      expect(safeUrl('javascript:alert(1)')).toBe('');
    });

    it('rejects data: URIs', () => {
      expect(safeUrl('data:text/html,<h1>XSS</h1>')).toBe('');
    });
  });

  describe('sanitizeBffModule', () => {
    it('returns the module name when it is in the allowlist', () => {
      expect(sanitizeBffModule('orchestra')).toBe('orchestra');
      expect(sanitizeBffModule('rewards')).toBe('rewards');
    });

    it('returns null for unknown module names', () => {
      expect(sanitizeBffModule('hack')).toBeNull();
    });

    it('returns null for path-traversal attempts', () => {
      expect(sanitizeBffModule('../secrets')).toBeNull();
      expect(sanitizeBffModule('orchestra/../../etc')).toBeNull();
    });

    it('returns null for empty / falsy input', () => {
      expect(sanitizeBffModule('')).toBeNull();
      expect(sanitizeBffModule(null)).toBeNull();
    });
  });

  describe('buildDynamicMediaUrl', () => {
    const BASE_URL = 'https://s7d9.scene7.com/is/image/QSR/product-hero';

    it('returns empty string for falsy input', () => {
      expect(buildDynamicMediaUrl('', 400)).toBe('');
      expect(buildDynamicMediaUrl(null, 400)).toBe('');
      expect(buildDynamicMediaUrl(undefined, 400)).toBe('');
    });

    it('appends wid, fmt=webp, and qlt=85 by default', () => {
      const result = buildDynamicMediaUrl(BASE_URL, 400);
      const url = new URL(result);
      expect(url.searchParams.get('wid')).toBe('400');
      expect(url.searchParams.get('fmt')).toBe('webp');
      expect(url.searchParams.get('qlt')).toBe('85');
    });

    it('respects a custom format option', () => {
      const result = buildDynamicMediaUrl(BASE_URL, 800, { format: 'jpeg' });
      const url = new URL(result);
      expect(url.searchParams.get('fmt')).toBe('jpeg');
      expect(url.searchParams.get('wid')).toBe('800');
    });

    it('respects a custom quality option', () => {
      const result = buildDynamicMediaUrl(BASE_URL, 600, { quality: 75 });
      const url = new URL(result);
      expect(url.searchParams.get('qlt')).toBe('75');
    });

    it('overrides existing width/format params already on the URL', () => {
      const urlWithParams = `${BASE_URL}?wid=200&fmt=png`;
      const result = buildDynamicMediaUrl(urlWithParams, 1200, { format: 'webp' });
      const url = new URL(result);
      expect(url.searchParams.get('wid')).toBe('1200');
      expect(url.searchParams.get('fmt')).toBe('webp');
    });

    it('returns the input unchanged when it is not a valid absolute URL', () => {
      const relative = '/is/image/QSR/item';
      expect(buildDynamicMediaUrl(relative, 400)).toBe(relative);
    });

    it('generates different URLs for different device widths', () => {
      const mobile = buildDynamicMediaUrl(BASE_URL, 400);
      const desktop = buildDynamicMediaUrl(BASE_URL, 800);
      expect(mobile).not.toBe(desktop);
      expect(new URL(mobile).searchParams.get('wid')).toBe('400');
      expect(new URL(desktop).searchParams.get('wid')).toBe('800');
    });

    it('2× retina URL has double the width of the 1× URL', () => {
      const w1x = 600;
      const url1x = buildDynamicMediaUrl(BASE_URL, w1x);
      const url2x = buildDynamicMediaUrl(BASE_URL, w1x * 2);
      expect(new URL(url1x).searchParams.get('wid')).toBe('600');
      expect(new URL(url2x).searchParams.get('wid')).toBe('1200');
    });
  });
});
