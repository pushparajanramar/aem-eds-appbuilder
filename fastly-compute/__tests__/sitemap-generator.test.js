/**
 * Tests for handlers/sitemap-generator.js (Fastly Compute ESM version)
 */

import {
  parseEdsHost,
  matchesGlob,
  shouldInclude,
  escapeXml,
  buildSitemapXml,
  deriveSiteBase,
} from '../src/handlers/sitemap-generator.js';

describe('sitemap-generator', () => {
  describe('parseEdsHost', () => {
    it('extracts branch, repo, org from a valid EDS host', () => {
      expect(parseEdsHost('main--qsr-us--org.aem.live')).toEqual({
        branch: 'main',
        repo: 'qsr-us',
        org: 'org',
      });
    });

    it('returns defaults for an invalid host string', () => {
      expect(parseEdsHost('invalid-host')).toEqual({
        branch: 'main',
        repo: 'qsr-us',
        org: 'org',
      });
    });
  });

  describe('matchesGlob', () => {
    it('matches exact paths', () => {
      expect(matchesGlob('/menu', '/menu')).toBe(true);
      expect(matchesGlob('/', '/')).toBe(true);
    });

    it('does not match different paths', () => {
      expect(matchesGlob('/menu', '/stores')).toBe(false);
    });

    it('matches subtree globs', () => {
      expect(matchesGlob('/menu/item1', '/menu/**')).toBe(true);
      expect(matchesGlob('/menu', '/menu/**')).toBe(true);
    });

    it('does not match non-subtree paths', () => {
      expect(matchesGlob('/stores/item1', '/menu/**')).toBe(false);
    });

    it('matches query-string glob', () => {
      expect(matchesGlob('/page?q=1', '/**?*')).toBe(true);
      expect(matchesGlob('/page', '/**?*')).toBe(false);
    });

    it('returns false for empty inputs', () => {
      expect(matchesGlob('', '/menu')).toBe(false);
      expect(matchesGlob('/menu', '')).toBe(false);
    });
  });

  describe('shouldInclude', () => {
    it('includes a path matching include and not matching exclude', () => {
      expect(shouldInclude('/menu/item1', ['/menu/**'], ['/admin/**'])).toBe(true);
    });

    it('excludes a path matching an exclude pattern', () => {
      expect(shouldInclude('/admin/settings', ['/admin/**'], ['/admin/**'])).toBe(false);
    });

    it('excludes a path not matching any include pattern', () => {
      expect(shouldInclude('/random', ['/menu/**'], [])).toBe(false);
    });
  });

  describe('escapeXml', () => {
    it('escapes XML special characters', () => {
      expect(escapeXml('a & b < c > d " e \' f')).toBe('a &amp; b &lt; c &gt; d &quot; e &apos; f');
    });
  });

  describe('buildSitemapXml', () => {
    it('generates valid XML with pages', () => {
      const xml = buildSitemapXml('https://example.com', [
        { path: '/menu', lastModified: '2024-01-01' },
        { path: '/stores' },
      ]);
      expect(xml).toContain('<?xml version="1.0"');
      expect(xml).toContain('<loc>https://example.com/menu</loc>');
      expect(xml).toContain('<lastmod>2024-01-01</lastmod>');
      expect(xml).toContain('<loc>https://example.com/stores</loc>');
    });

    it('deduplicates explicit entries and query-index pages', () => {
      const xml = buildSitemapXml(
        'https://example.com',
        [{ path: '/menu' }],
        [{ loc: 'https://example.com/menu', changefreq: 'daily', priority: '1.0' }],
      );
      const count = (xml.match(/<loc>/g) || []).length;
      expect(count).toBe(1);
      expect(xml).toContain('<changefreq>daily</changefreq>');
    });
  });

  describe('deriveSiteBase', () => {
    it('derives origin from explicit siteMap entries', () => {
      const base = deriveSiteBase('main--qsr-us--org.aem.live', [{ loc: 'https://www.qsr.com/menu' }]);
      expect(base).toBe('https://www.qsr.com');
    });

    it('falls back to EDS host when no siteMap entries', () => {
      const base = deriveSiteBase('main--qsr-us--org.aem.live', []);
      expect(base).toBe('https://main--qsr-us--org.aem.live');
    });
  });
});
