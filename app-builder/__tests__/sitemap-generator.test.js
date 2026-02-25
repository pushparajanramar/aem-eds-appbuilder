/**
 * Tests for sitemap-generator action
 *
 * All tests exercise pure helper functions only — no network calls are made.
 */

jest.mock('@adobe/aio-sdk', () => ({
  Core: {
    Logger: jest.fn(() => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    })),
  },
}));

const {
  parseEdsHost,
  matchesGlob,
  shouldInclude,
  escapeXml,
  buildSitemapXml,
  deriveSiteBase,
} = require('../actions/sitemap-generator/index');

// ---------------------------------------------------------------------------
// parseEdsHost
// ---------------------------------------------------------------------------
describe('parseEdsHost', () => {
  it('parses branch, repo and org from a standard EDS host string', () => {
    const result = parseEdsHost('main--qsr-us--org.aem.live');
    expect(result.branch).toBe('main');
    expect(result.repo).toBe('qsr-us');
    expect(result.org).toBe('org');
  });

  it('parses the uk market host correctly', () => {
    const result = parseEdsHost('main--qsr-uk--org.aem.live');
    expect(result.repo).toBe('qsr-uk');
    expect(result.org).toBe('org');
  });

  it('parses the jp market host correctly', () => {
    const result = parseEdsHost('main--qsr-jp--org.aem.live');
    expect(result.repo).toBe('qsr-jp');
  });

  it('returns safe defaults for an unrecognised host', () => {
    const result = parseEdsHost('not-a-valid-host');
    expect(result.branch).toBe('main');
    expect(result.repo).toBe('qsr-us');
    expect(result.org).toBe('org');
  });
});

// ---------------------------------------------------------------------------
// matchesGlob
// ---------------------------------------------------------------------------
describe('matchesGlob', () => {
  it('matches the root path exactly', () => {
    expect(matchesGlob('/', '/')).toBe(true);
  });

  it('does not match a non-root path against the root pattern', () => {
    expect(matchesGlob('/menu', '/')).toBe(false);
  });

  it('matches an exact path', () => {
    expect(matchesGlob('/stores', '/stores')).toBe(true);
    expect(matchesGlob('/stores', '/stores/**')).toBe(true); // prefix itself matches subtree glob
  });

  it('matches subtree glob /prefix/**', () => {
    expect(matchesGlob('/menu/item1', '/menu/**')).toBe(true);
    expect(matchesGlob('/menu', '/menu/**')).toBe(true);
    expect(matchesGlob('/menu/sub/item', '/menu/**')).toBe(true);
  });

  it('does not match a sibling path with /prefix/**', () => {
    expect(matchesGlob('/menubar', '/menu/**')).toBe(false);
  });

  it('matches /**?* for paths containing a query string character', () => {
    expect(matchesGlob('/page?preview=true', '/**?*')).toBe(true);
  });

  it('does not match /**?* for clean paths', () => {
    expect(matchesGlob('/menu/item1', '/**?*')).toBe(false);
  });

  it('returns false for empty inputs', () => {
    expect(matchesGlob('', '/menu/**')).toBe(false);
    expect(matchesGlob('/menu', '')).toBe(false);
    expect(matchesGlob(null, '/menu/**')).toBe(false);
    expect(matchesGlob('/menu', null)).toBe(false);
  });

  it('matches the stores subtree', () => {
    expect(matchesGlob('/stores/seattle', '/stores/**')).toBe(true);
  });

  it('matches /rewards/**', () => {
    expect(matchesGlob('/rewards/gold', '/rewards/**')).toBe(true);
    expect(matchesGlob('/account/settings', '/rewards/**')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// shouldInclude
// ---------------------------------------------------------------------------
describe('shouldInclude', () => {
  const include = ['/', '/menu/**', '/stores/**', '/rewards/**'];
  const exclude = ['/drafts/**', '/tools/**', '/**?*'];

  it('includes the root path', () => {
    expect(shouldInclude('/', include, exclude)).toBe(true);
  });

  it('includes pages in /menu/', () => {
    expect(shouldInclude('/menu/grande-latte', include, exclude)).toBe(true);
  });

  it('excludes draft pages', () => {
    expect(shouldInclude('/drafts/upcoming-item', include, exclude)).toBe(false);
  });

  it('excludes tool pages', () => {
    expect(shouldInclude('/tools/debug', include, exclude)).toBe(false);
  });

  it('excludes pages with query strings', () => {
    expect(shouldInclude('/menu?preview=1', include, exclude)).toBe(false);
  });

  it('excludes pages not matching any include pattern', () => {
    expect(shouldInclude('/account/settings', include, exclude)).toBe(false);
  });

  it('excludes /account/** when it is not in the include list', () => {
    expect(shouldInclude('/account', include, exclude)).toBe(false);
  });

  it('returns false when include is empty', () => {
    expect(shouldInclude('/menu/item1', [], exclude)).toBe(false);
  });

  it('returns false when a page matches exclude even if it also matches include', () => {
    const inc = ['/drafts/**'];
    const exc = ['/drafts/**'];
    expect(shouldInclude('/drafts/item', inc, exc)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// escapeXml
// ---------------------------------------------------------------------------
describe('escapeXml', () => {
  it('escapes ampersands', () => {
    expect(escapeXml('a & b')).toBe('a &amp; b');
  });

  it('escapes angle brackets', () => {
    expect(escapeXml('<script>')).toBe('&lt;script&gt;');
  });

  it('escapes double quotes', () => {
    expect(escapeXml('"hello"')).toBe('&quot;hello&quot;');
  });

  it('escapes single quotes', () => {
    expect(escapeXml("it's")).toBe('it&apos;s');
  });

  it('does not modify clean strings', () => {
    expect(escapeXml('https://www.qsr.com/menu')).toBe('https://www.qsr.com/menu');
  });

  it('coerces non-string input to string', () => {
    expect(escapeXml(42)).toBe('42');
  });
});

// ---------------------------------------------------------------------------
// buildSitemapXml
// ---------------------------------------------------------------------------
describe('buildSitemapXml', () => {
  const siteBase = 'https://www.qsr.com';

  it('produces valid XML declaration and urlset wrapper', () => {
    const xml = buildSitemapXml(siteBase, [], []);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain('</urlset>');
  });

  it('includes a page from the query index as a <url> entry', () => {
    const pages = [{ path: '/menu/grande-latte', lastModified: '2025-06-01' }];
    const xml = buildSitemapXml(siteBase, pages, []);
    expect(xml).toContain('<loc>https://www.qsr.com/menu/grande-latte</loc>');
    expect(xml).toContain('<lastmod>2025-06-01</lastmod>');
  });

  it('includes explicit siteMap entries with changefreq and priority', () => {
    const explicitEntries = [
      { loc: 'https://www.qsr.com/', changefreq: 'daily', priority: '1.0' },
    ];
    const xml = buildSitemapXml(siteBase, [], explicitEntries);
    expect(xml).toContain('<changefreq>daily</changefreq>');
    expect(xml).toContain('<priority>1.0</priority>');
  });

  it('deduplicates: explicit entry takes precedence over query-index entry for the same path', () => {
    const explicitEntries = [
      { loc: 'https://www.qsr.com/', changefreq: 'daily', priority: '1.0' },
    ];
    const pages = [{ path: '/', lastModified: '2025-01-01' }];
    const xml = buildSitemapXml(siteBase, pages, explicitEntries);
    // Should appear exactly once
    const count = (xml.match(/<loc>https:\/\/www\.qsr\.com\/<\/loc>/g) || []).length;
    expect(count).toBe(1);
    // Should carry the authored changefreq (not just lastmod from query index)
    expect(xml).toContain('<changefreq>daily</changefreq>');
  });

  it('escapes XML special characters in loc values', () => {
    const pages = [{ path: '/menu/caf\u00e9&latte' }];
    const xml = buildSitemapXml(siteBase, pages, []);
    expect(xml).not.toContain('&latte<');
    // The & in the path should be escaped
    expect(xml).toContain('&amp;');
  });

  it('omits <lastmod> when lastModified is absent from a page entry', () => {
    const pages = [{ path: '/stores' }];
    const xml = buildSitemapXml(siteBase, pages, []);
    expect(xml).not.toContain('<lastmod>');
  });

  it('returns an empty urlset when both pages and explicit entries are empty', () => {
    const xml = buildSitemapXml(siteBase, [], []);
    expect(xml).not.toContain('<url>');
  });

  it('skips explicit entries whose loc cannot be parsed as a URL', () => {
    const explicitEntries = [{ loc: 'not-a-url', changefreq: 'daily' }];
    const xml = buildSitemapXml(siteBase, [], explicitEntries);
    expect(xml).not.toContain('not-a-url');
  });
});

// ---------------------------------------------------------------------------
// deriveSiteBase
// ---------------------------------------------------------------------------
describe('deriveSiteBase', () => {
  it('returns the origin of the first siteMap entry', () => {
    const siteMap = [{ loc: 'https://www.qsr.com/', changefreq: 'daily' }];
    expect(deriveSiteBase('main--qsr-us--org.aem.live', siteMap)).toBe('https://www.qsr.com');
  });

  it('falls back to https://edsHost when siteMap is empty', () => {
    expect(deriveSiteBase('main--qsr-us--org.aem.live', [])).toBe('https://main--qsr-us--org.aem.live');
  });

  it('falls back when siteMap is undefined', () => {
    expect(deriveSiteBase('main--qsr-uk--org.aem.live', undefined)).toBe('https://main--qsr-uk--org.aem.live');
  });

  it('falls back when the first loc is not a valid URL', () => {
    const siteMap = [{ loc: 'not-a-url' }];
    expect(deriveSiteBase('main--qsr-jp--org.aem.live', siteMap)).toBe('https://main--qsr-jp--org.aem.live');
  });
});
