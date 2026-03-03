/**
 * Tests for shared/url-utils.js (Fastly Compute ESM version)
 */

import {
  safeUrl,
  sanitizeBffModule,
  ALLOWED_BFF_MODULES,
  buildDynamicMediaUrl,
  buildDynamicMediaSrcset,
} from '../src/shared/url-utils.js';

describe('url-utils', () => {
  describe('safeUrl', () => {
    it('allows https URLs', () => {
      expect(safeUrl('https://example.com/path')).toBe('https://example.com/path');
    });

    it('allows http URLs', () => {
      expect(safeUrl('http://example.com/path')).toBe('http://example.com/path');
    });

    it('allows relative paths', () => {
      expect(safeUrl('/menu/item1')).toBe('/menu/item1');
    });

    it('rejects javascript: URIs', () => {
      expect(safeUrl('javascript:alert(1)')).toBe('');
    });

    it('rejects data: URIs', () => {
      expect(safeUrl('data:text/html,<h1>XSS</h1>')).toBe('');
    });

    it('returns empty string for null/undefined', () => {
      expect(safeUrl(null)).toBe('');
      expect(safeUrl(undefined)).toBe('');
      expect(safeUrl('')).toBe('');
    });
  });

  describe('sanitizeBffModule', () => {
    it('allows known modules', () => {
      expect(sanitizeBffModule('orchestra')).toBe('orchestra');
      expect(sanitizeBffModule('stream')).toBe('stream');
      expect(sanitizeBffModule('loyalty')).toBe('loyalty');
    });

    it('rejects unknown modules', () => {
      expect(sanitizeBffModule('evil')).toBeNull();
      expect(sanitizeBffModule('admin')).toBeNull();
    });

    it('rejects modules with path separators', () => {
      expect(sanitizeBffModule('orchestra/../admin')).toBeNull();
      expect(sanitizeBffModule('orchestra/admin')).toBeNull();
    });

    it('normalises to lowercase', () => {
      expect(sanitizeBffModule('ORCHESTRA')).toBe('orchestra');
      expect(sanitizeBffModule('Stream')).toBe('stream');
    });

    it('returns null for null/undefined/empty', () => {
      expect(sanitizeBffModule(null)).toBeNull();
      expect(sanitizeBffModule(undefined)).toBeNull();
      expect(sanitizeBffModule('')).toBeNull();
    });

    it('has all expected modules in the allowlist', () => {
      const expected = ['orchestra', 'stream', 'loyalty', 'card', 'orderhistory', 'product', 'promotion', 'rewards', 'location', 'offers', 'billingaddress', 'barcode'];
      for (const mod of expected) {
        expect(ALLOWED_BFF_MODULES.has(mod)).toBe(true);
      }
    });
  });

  describe('buildDynamicMediaUrl', () => {
    it('appends wid, fmt, qlt params to absolute URLs', () => {
      const result = buildDynamicMediaUrl('https://cdn.example.com/image.jpg', 400);
      expect(result).toContain('wid=400');
      expect(result).toContain('fmt=webp');
      expect(result).toContain('qlt=85');
    });

    it('supports custom format and quality', () => {
      const result = buildDynamicMediaUrl('https://cdn.example.com/image.jpg', 800, { format: 'jpeg', quality: 90 });
      expect(result).toContain('fmt=jpeg');
      expect(result).toContain('qlt=90');
    });

    it('returns empty string for falsy input', () => {
      expect(buildDynamicMediaUrl('', 400)).toBe('');
      expect(buildDynamicMediaUrl(null, 400)).toBe('');
    });

    it('returns relative paths unchanged', () => {
      expect(buildDynamicMediaUrl('/images/test.jpg', 400)).toBe('/images/test.jpg');
    });
  });

  describe('buildDynamicMediaSrcset', () => {
    it('generates srcset with 0.5x, 1x, and 2x widths', () => {
      const result = buildDynamicMediaSrcset('https://cdn.example.com/image.jpg', 800);
      expect(result).toContain('400w');
      expect(result).toContain('800w');
      expect(result).toContain('1600w');
    });

    it('returns empty string for falsy input', () => {
      expect(buildDynamicMediaSrcset('', 800)).toBe('');
    });
  });
});
