/**
 * Tests for apps/eds-us/scripts/seo.js
 *
 * Validates page-level SEO enhancements including meta tags,
 * Open Graph, Twitter Cards, JSON-LD, and canonical URLs.
 */

import { jest } from '@jest/globals';

/* ── DOM / Browser mocks ─────────────────────────────────────────── */

const metaTags = {};
const linkTags = {};
const scripts = [];

const headMock = {
  querySelector: jest.fn((selector) => {
    // meta[name="..."] or meta[property="..."]
    const nameMatch = selector.match(/meta\[name="([^"]+)"\]/);
    const propMatch = selector.match(/meta\[property="([^"]+)"\]/);
    const linkMatch = selector.match(/link\[rel="([^"]+)"\]/);
    if (nameMatch) return metaTags[`name:${nameMatch[1]}`] || null;
    if (propMatch) return metaTags[`property:${propMatch[1]}`] || null;
    if (linkMatch) return linkTags[linkMatch[1]] || null;
    return null;
  }),
  append: jest.fn((el) => {
    if (el._type === 'meta') {
      const key = el._attr === 'name' ? `name:${el._key}` : `property:${el._key}`;
      metaTags[key] = el;
    } else if (el._type === 'link') {
      linkTags[el._rel] = el;
    } else if (el._type === 'script') {
      scripts.push(el);
    }
  }),
};

const elementFactory = (type) => {
  const attrs = {};
  return {
    _type: type,
    setAttribute(k, v) { attrs[k] = v; if (k === 'name' || k === 'property') { this._attr = k; this._key = v; } if (k === 'rel') this._rel = v; },
    getAttribute(k) { return attrs[k] || null; },
    hasAttribute(k) { return k in attrs; },
    set textContent(v) { this._textContent = v; },
    get textContent() { return this._textContent || ''; },
    set content(v) { attrs.content = v; },
    get content() { return attrs.content; },
    set href(v) { attrs.href = v; },
    get href() { return attrs.href; },
  };
};

Object.defineProperty(globalThis, 'document', {
  value: {
    title: 'Test Page',
    head: headMock,
    createElement: jest.fn((tag) => elementFactory(tag === 'meta' ? 'meta' : tag === 'link' ? 'link' : 'script')),
    documentElement: { lang: '', setAttribute: jest.fn((k, v) => { globalThis.document.documentElement[k] = v; }) },
    readyState: 'complete',
    querySelector: jest.fn(() => null),
  },
  writable: true,
});

Object.defineProperty(globalThis, 'window', {
  value: {
    location: { origin: 'https://www.qsr.com', pathname: '/menu' },
    addEventListener: jest.fn(),
  },
  writable: true,
});

/* ── Import the module under test ──────────────────────────────── */

const { initSEO, addJsonLd } = await import('../scripts/seo.js');

/* ── Tests ──────────────────────────────────────────────────────── */

describe('initSEO', () => {
  beforeEach(() => {
    Object.keys(metaTags).forEach((k) => delete metaTags[k]);
    Object.keys(linkTags).forEach((k) => delete linkTags[k]);
    scripts.length = 0;
    headMock.append.mockClear();
    headMock.querySelector.mockClear();
    document.createElement.mockClear();
    document.title = 'Test Page';
    document.documentElement.lang = '';
  });

  it('sets the lang attribute when missing', () => {
    initSEO();
    expect(document.documentElement.setAttribute).toHaveBeenCalledWith('lang', expect.any(String));
  });

  it('does not override existing lang attribute', () => {
    document.documentElement.lang = 'fr';
    const spy = document.documentElement.setAttribute;
    spy.mockClear();
    initSEO();
    // Should not be called since lang already set
    expect(spy).not.toHaveBeenCalledWith('lang', expect.anything());
  });

  it('creates canonical link tag', () => {
    initSEO();
    const canonicalCreated = headMock.append.mock.calls.some(
      ([el]) => el._type === 'link',
    );
    expect(canonicalCreated).toBe(true);
  });

  it('creates Open Graph meta tags', () => {
    initSEO();
    const ogCalls = headMock.append.mock.calls.filter(
      ([el]) => el._type === 'meta' && el._attr === 'property' && el._key?.startsWith('og:'),
    );
    // Should create og:title, og:description, og:url, og:type, og:locale at minimum
    expect(ogCalls.length).toBeGreaterThanOrEqual(4);
  });

  it('creates Twitter Card meta tags', () => {
    initSEO();
    const twitterCalls = headMock.append.mock.calls.filter(
      ([el]) => el._type === 'meta' && el._key?.startsWith('twitter:'),
    );
    // Should create twitter:card and twitter:title at minimum
    // twitter:description may be skipped if no description metadata exists
    expect(twitterCalls.length).toBeGreaterThanOrEqual(2);
  });

  it('injects JSON-LD structured data', () => {
    initSEO();
    const jsonLdCalls = headMock.append.mock.calls.filter(
      ([el]) => el._type === 'script',
    );
    // Should create Organization and WebSite structured data at minimum
    expect(jsonLdCalls.length).toBeGreaterThanOrEqual(2);
  });
});

describe('addJsonLd', () => {
  beforeEach(() => {
    scripts.length = 0;
    headMock.append.mockClear();
  });

  it('injects a script tag with type application/ld+json', () => {
    addJsonLd({ '@context': 'https://schema.org', '@type': 'Organization', name: 'Test' });
    const scriptCalls = headMock.append.mock.calls.filter(([el]) => el._type === 'script');
    expect(scriptCalls.length).toBe(1);
  });

  it('does nothing when data is null', () => {
    addJsonLd(null);
    const scriptCalls = headMock.append.mock.calls.filter(([el]) => el._type === 'script');
    expect(scriptCalls.length).toBe(0);
  });
});
