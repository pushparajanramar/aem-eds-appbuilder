/**
 * Tests for shared/html-utils.js
 */

import { escapeHtml } from '../src/shared/html-utils.js';

describe('html-utils', () => {
  describe('escapeHtml', () => {
    it('escapes & to &amp;', () => {
      expect(escapeHtml('a & b')).toBe('a &amp; b');
    });

    it('escapes < and > to entities', () => {
      expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
    });

    it('escapes double quotes', () => {
      expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
    });

    it('escapes single quotes', () => {
      expect(escapeHtml("it's")).toBe('it&#39;s');
    });

    it('handles non-string inputs', () => {
      expect(escapeHtml(123)).toBe('123');
      expect(escapeHtml(null)).toBe('null');
    });
  });
});
