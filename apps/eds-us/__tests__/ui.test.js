/**
 * UI rendering tests with mock data
 *
 * Validates the complete block rendering pipeline as a UI tester would:
 *   mock data → DOM structure → block decorator → web-component attributes
 *
 * For each tested block we:
 *   1. Load the relevant mock-data JSON file.
 *   2. Build a minimal in-memory DOM from that data.
 *   3. Call the block's decorate() function (with a11y.js and
 *      ue/instrumentation.js mocked).
 *   4. Execute the captured loadComponent callback.
 *   5. Assert that the resulting web-component's attributes match
 *      the values from the mock data.
 *
 * Blocks covered: accordion, alert, banner, breadcrumbs, cards,
 *                 carousel, hero, tabs, table.
 */

import { jest } from '@jest/globals';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MOCK_DATA_DIR = join(__dirname, '..', 'mock-data');

/* ── Load mock data ──────────────────────────────────────────────── */

const mockBlocksAD = JSON.parse(readFileSync(join(MOCK_DATA_DIR, 'blocks-a-d.json'), 'utf8'));
const mockBlocksDL = JSON.parse(readFileSync(join(MOCK_DATA_DIR, 'blocks-d-l.json'), 'utf8'));
const mockBlocksMR = JSON.parse(readFileSync(join(MOCK_DATA_DIR, 'blocks-m-r.json'), 'utf8'));
const mockBlocksSZ = JSON.parse(readFileSync(join(MOCK_DATA_DIR, 'blocks-s-z.json'), 'utf8'));

/* ── Module mocks (must precede dynamic imports) ─────────────────── */

/**
 * Intercepts withLazyLoading calls and stores each block's loadComponent
 * callback so tests can invoke it directly and inspect the web component.
 */
const loadComponentRegistry = {};

jest.unstable_mockModule('../scripts/a11y.js', () => ({
  withLazyLoading: jest.fn((block, { loadComponent }) => {
    const name = block.dataset.blockName
      || block.getAttribute('data-block-name')
      || 'unknown';
    loadComponentRegistry[name] = loadComponent;
  }),
  ARIA_ROLES: {},
  setLoadingState: jest.fn(),
  clearLoadingState: jest.fn(),
}));

jest.unstable_mockModule('../ue/instrumentation.js', () => ({
  annotateBlock: jest.fn(),
  annotateField: jest.fn(),
  getCFPath: jest.fn(() => '/test-path'),
  buildAEMUrn: jest.fn((p) => `urn:aemconnection:${p}`),
  buildSharePointUrn: jest.fn((p) => `urn:sharepoint:${p}`),
}));

/* ── Minimal in-memory DOM ───────────────────────────────────────── */

/**
 * A lightweight DOM element that supports the subset of the browser
 * DOM API used by the block decorators under test.
 */
class MockElement {
  constructor(tagName = 'div') {
    this.tagName = tagName.toLowerCase();
    this._attrs = {};
    this._children = [];
    this.parentElement = null;
    this._innerHTML = '';
    this._textContent = '';
    this.dataset = {};
    this.classList = {
      _list: new Set(),
      add(c) { this._list.add(c); },
      remove(c) { this._list.delete(c); },
      contains(c) { return this._list.has(c); },
    };
    this.style = {};
  }

  /* ── children / content ── */

  get children() { return this._children; }

  get innerHTML() {
    // If children were added via appendChild, serialize them; otherwise
    // return the string that was assigned directly via innerHTML setter.
    if (this._children.length > 0) {
      return this._children.map((c) => {
        const attrs = Object.entries(c._attrs || {})
          .map(([k, v]) => ` ${k}="${v}"`)
          .join('');
        // Void elements (img, hr, br, input) have no closing tag.
        if (['img', 'hr', 'br', 'input'].includes(c.tagName)) {
          return `<${c.tagName}${attrs}>`;
        }
        return `<${c.tagName}${attrs}>${c.innerHTML}</${c.tagName}>`;
      }).join('');
    }
    return this._innerHTML;
  }

  set innerHTML(v) {
    this._innerHTML = v;
    // Strip HTML tags iteratively so nested constructs like <scr<a>ipt>
    // cannot reassemble into a tag after a single-pass substitution.
    let text = v;
    let prev;
    do { prev = text; text = text.replace(/<[^>]*>/g, ''); } while (text !== prev);
    this._textContent = text;
    this._children = [];
  }

  get textContent() { return this._textContent; }

  set textContent(v) {
    this._textContent = v;
    this._innerHTML = v;
  }

  /* ── element properties ── */

  get src() { return this._attrs.src || ''; }
  get alt() { return this._attrs.alt || ''; }
  get href() { return this._attrs.href || ''; }

  /* ── attribute API ── */

  setAttribute(k, v) {
    this._attrs[k] = String(v);
    if (k === 'data-block-name') this.dataset.blockName = v;
  }

  getAttribute(k) { return this._attrs[k] ?? null; }
  hasAttribute(k) { return k in this._attrs; }
  removeAttribute(k) { delete this._attrs[k]; }

  /* ── tree manipulation ── */

  appendChild(child) {
    child.parentElement = this;
    this._children.push(child);
    return child;
  }

  append(...children) { children.forEach((c) => this.appendChild(c)); }

  replaceWith(el) { this._replacedWith = el; }

  closest(selector) {
    let el = this.parentElement;
    while (el) {
      const tag = selector.replace(/[.#\[].*/, '').toLowerCase();
      if (!tag || el.tagName === tag) return el;
      el = el.parentElement;
    }
    return null;
  }

  addEventListener() {}
  removeEventListener() {}

  /* ── CSS selector helpers ── */

  /**
   * Tests whether this element matches any of the provided tag selectors.
   * Supports: plain tag names, comma-separated tags, attribute presence
   * selectors like a[href].
   */
  _matchesTags(tags) {
    return tags.some((t) => {
      const clean = t.trim().toLowerCase();
      if (clean.includes('[')) {
        const [tag, attrPart] = clean.split('[');
        const attr = attrPart.replace(/["\]]/g, '').split('=')[0];
        if (tag && this.tagName !== tag) return false;
        return this.hasAttribute(attr);
      }
      return this.tagName === clean;
    });
  }

  querySelector(selector) {
    // :scope > <tag>  →  direct children only
    if (selector.startsWith(':scope >')) {
      const childTag = selector.replace(':scope >', '').trim().toLowerCase();
      return this._children.find((c) => c.tagName === childTag) || null;
    }
    const tags = selector.split(',');
    for (const child of this._children) {
      if (child._matchesTags && child._matchesTags(tags)) return child;
      const found = child.querySelector ? child.querySelector(selector) : null;
      if (found) return found;
    }
    return null;
  }

  querySelectorAll(selector) {
    // :scope > div  →  direct div children
    if (selector === ':scope > div') {
      return this._children.filter((c) => c.tagName === 'div');
    }
    const results = [];
    const tags = selector.split(',');
    for (const child of this._children) {
      if (child._matchesTags && child._matchesTags(tags)) results.push(child);
      if (child.querySelectorAll) {
        results.push(...child.querySelectorAll(selector));
      }
    }
    return results;
  }
}

/* ── DOM builder utilities ───────────────────────────────────────── */

/** Creates a MockElement with optional text/html/attribute/child config. */
function el(tagName, { text, html, attrs, children } = {}) {
  const elem = new MockElement(tagName);
  if (text !== undefined) elem.textContent = text;
  if (html !== undefined) elem.innerHTML = html;
  if (attrs) Object.entries(attrs).forEach(([k, v]) => elem.setAttribute(k, v));
  if (children) children.forEach((c) => elem.appendChild(c));
  return elem;
}

/** Creates a block container div with data-block-name and optional classes. */
function makeBlock(blockName, rows, { classes = [] } = {}) {
  const block = new MockElement('div');
  block.setAttribute('data-block-name', blockName);
  block.dataset.blockName = blockName;
  classes.forEach((c) => block.classList.add(c));
  rows.forEach((r) => block.appendChild(r));
  return block;
}

/** Creates a row div containing the supplied column elements. */
function makeRow(...cols) {
  const row = new MockElement('div');
  cols.forEach((c) => row.appendChild(c));
  return row;
}

/** Creates a column div whose innerHTML is set to the supplied string. */
function makeCol(html = '') {
  return el('div', { html });
}

/**
 * Creates a column div that holds an <img> element as a DOM child,
 * enabling querySelector('img') to find it inside the column.
 */
function makeImgCol(src, alt) {
  const img = el('img', { attrs: { src, alt } });
  const col = new MockElement('div');
  col.appendChild(img);
  return col;
}

/* ── Global browser-API mocks ────────────────────────────────────── */

const docEl = new MockElement('html');
docEl.dataset = { device: 'desktop' };
docEl.lang = '';
docEl.setAttribute = (k, v) => { docEl._attrs[k] = v; docEl[k] = v; };

globalThis.document = {
  createElement: (tagName) => new MockElement(tagName),
  documentElement: docEl,
  body: new MockElement('body'),
  title: 'Test Page',
  querySelector: () => null,
  head: { querySelector: () => null, append: () => {} },
};

globalThis.window = {
  location: {
    pathname: '/',
    href: 'https://test.com/',
    origin: 'https://test.com',
    search: '',
  },
  adobeDataLayer: [],
};

/* ── Import block decorators (after mock registrations) ─────────── */

const { default: decorateAccordion } = await import('../blocks/accordion/accordion.js');
const { default: decorateAlert } = await import('../blocks/alert/alert.js');
const { default: decorateBanner } = await import('../blocks/banner/banner.js');
const { default: decorateBreadcrumbs } = await import('../blocks/breadcrumbs/breadcrumbs.js');
const { default: decorateCards } = await import('../blocks/cards/cards.js');
const { default: decorateCarousel } = await import('../blocks/carousel/carousel.js');
const { default: decorateHero } = await import('../blocks/hero/hero.js');
const { default: decorateTabs } = await import('../blocks/tabs/tabs.js');
const { default: decorateTable } = await import('../blocks/table/table.js');

/* ── Helper ──────────────────────────────────────────────────────── */

/** Invokes the loadComponent callback registered for the named block. */
async function renderBlock(blockName) {
  const fn = loadComponentRegistry[blockName];
  return fn ? fn() : null;
}

/* ── Tests ───────────────────────────────────────────────────────── */

describe('UI rendering with mock data', () => {
  /* ── accordion ─────────────────────────────────────────────────── */
  describe('accordion block', () => {
    const mockData = mockBlocksAD.accordion;
    let wc;

    beforeAll(async () => {
      const rows = mockData.items.map((item) => makeRow(
        makeCol(item.label),
        makeCol(item.body),
      ));
      decorateAccordion(makeBlock('accordion', rows));
      wc = await renderBlock('accordion');
    });

    it('invokes withLazyLoading', () => {
      expect(loadComponentRegistry.accordion).toBeDefined();
    });

    it('creates qsr-accordion web component', () => {
      expect(wc).toBeTruthy();
      expect(wc.tagName).toBe('qsr-accordion');
    });

    it('items count matches mock data', () => {
      const items = JSON.parse(wc.getAttribute('items'));
      expect(items).toHaveLength(mockData.items.length);
    });

    it('first item label matches mock data', () => {
      const items = JSON.parse(wc.getAttribute('items'));
      expect(items[0].label).toBe(mockData.items[0].label);
    });

    it('first item body matches mock data', () => {
      const items = JSON.parse(wc.getAttribute('items'));
      expect(items[0].body).toBe(mockData.items[0].body);
    });

    it('last item label matches mock data', () => {
      const items = JSON.parse(wc.getAttribute('items'));
      const last = mockData.items[mockData.items.length - 1];
      expect(items[items.length - 1].label).toBe(last.label);
    });
  });

  /* ── alert ─────────────────────────────────────────────────────── */
  describe('alert block', () => {
    const mockVariant = mockBlocksAD.alert.variants[1]; // success
    let wc;

    beforeAll(async () => {
      decorateAlert(makeBlock('alert', [
        makeRow(makeCol(mockVariant.variant)),
        makeRow(makeCol(mockVariant.contenthtml)),
      ]));
      wc = await renderBlock('alert');
    });

    it('creates qsr-alert web component', () => {
      expect(wc).toBeTruthy();
      expect(wc.tagName).toBe('qsr-alert');
    });

    it('variant matches mock data', () => {
      expect(wc.getAttribute('variant')).toBe(mockVariant.variant);
    });

    it('contenthtml matches mock data', () => {
      expect(wc.getAttribute('contenthtml')).toBe(mockVariant.contenthtml);
    });
  });

  /* ── banner ─────────────────────────────────────────────────────── */
  describe('banner block', () => {
    const mockItem = mockBlocksAD.banner.items[0]; // default variant
    let wc;

    beforeAll(async () => {
      decorateBanner(makeBlock('banner', [
        makeRow(makeCol(mockItem.contenthtml)),
        makeRow(makeCol(mockItem.ctahtml)),
      ]));
      wc = await renderBlock('banner');
    });

    it('creates qsr-banner web component', () => {
      expect(wc).toBeTruthy();
      expect(wc.tagName).toBe('qsr-banner');
    });

    it('contenthtml matches mock data', () => {
      expect(wc.getAttribute('contenthtml')).toBe(mockItem.contenthtml);
    });

    it('ctahtml matches mock data', () => {
      expect(wc.getAttribute('ctahtml')).toBe(mockItem.ctahtml);
    });

    it('variant defaults to "default" when no variant class is present', () => {
      expect(wc.getAttribute('variant')).toBe('default');
    });
  });

  /* ── banner (warning variant) ────────────────────────────────────── */
  describe('banner block — warning variant', () => {
    const mockItem = mockBlocksAD.banner.items[1]; // warning variant
    let wc;

    beforeAll(async () => {
      decorateBanner(makeBlock('banner', [
        makeRow(makeCol(mockItem.contenthtml)),
        makeRow(makeCol(mockItem.ctahtml)),
      ], { classes: ['warning'] }));
      wc = await renderBlock('banner');
    });

    it('variant is "warning" when warning class is present', () => {
      expect(wc.getAttribute('variant')).toBe('warning');
    });
  });

  /* ── breadcrumbs ─────────────────────────────────────────────────── */
  describe('breadcrumbs block', () => {
    const mockData = mockBlocksAD.breadcrumbs;
    let wc;

    beforeAll(async () => {
      const rows = mockData.items.map((item) => {
        if (item.path) {
          // Linked breadcrumb: wrap an <a> inside a <div> inside the row.
          const link = el('a', { text: item.title, attrs: { href: item.path } });
          return makeRow(el('div', { children: [link] }));
        }
        // Current-page breadcrumb: plain text column, no link.
        return makeRow(makeCol(item.title));
      });
      decorateBreadcrumbs(makeBlock('breadcrumbs', rows));
      wc = await renderBlock('breadcrumbs');
    });

    it('creates qsr-breadcrumbs web component', () => {
      expect(wc).toBeTruthy();
      expect(wc.tagName).toBe('qsr-breadcrumbs');
    });

    it('items count matches mock data', () => {
      const items = JSON.parse(wc.getAttribute('items'));
      expect(items).toHaveLength(mockData.items.length);
    });

    it('first item title matches mock data', () => {
      const items = JSON.parse(wc.getAttribute('items'));
      expect(items[0].title).toBe(mockData.items[0].title);
    });

    it('first item path matches mock data', () => {
      const items = JSON.parse(wc.getAttribute('items'));
      expect(items[0].path).toBe(mockData.items[0].path);
    });

    it('last item (current page) has no path property', () => {
      const items = JSON.parse(wc.getAttribute('items'));
      const last = items[items.length - 1];
      expect(last.title).toBe(mockData.items[mockData.items.length - 1].title);
      expect(last.path).toBeUndefined();
    });
  });

  /* ── cards ──────────────────────────────────────────────────────── */
  describe('cards block', () => {
    const mockData = mockBlocksAD.cards;
    let wc;

    beforeAll(async () => {
      const rows = mockData.items.map((item) => {
        // Image column: actual <img> child so querySelector('img') works.
        const imgCol = makeImgCol(item.imageUrl, item.imageAlt);
        // Content column: heading as DOM child so querySelector('h3') works.
        const heading = el('h3', { text: item.title });
        const contentCol = new MockElement('div');
        contentCol.appendChild(heading);
        return makeRow(imgCol, contentCol);
      });
      decorateCards(makeBlock('cards', rows));
      wc = await renderBlock('cards');
    });

    it('creates qsr-cards web component', () => {
      expect(wc).toBeTruthy();
      expect(wc.tagName).toBe('qsr-cards');
    });

    it('items count matches mock data', () => {
      const items = JSON.parse(wc.getAttribute('items'));
      expect(items).toHaveLength(mockData.items.length);
    });

    it('first card imageUrl matches mock data', () => {
      const items = JSON.parse(wc.getAttribute('items'));
      expect(items[0].imageUrl).toBe(mockData.items[0].imageUrl);
    });

    it('first card imageAlt matches mock data', () => {
      const items = JSON.parse(wc.getAttribute('items'));
      expect(items[0].imageAlt).toBe(mockData.items[0].imageAlt);
    });

    it('first card title matches mock data', () => {
      const items = JSON.parse(wc.getAttribute('items'));
      expect(items[0].title).toBe(mockData.items[0].title);
    });

    it('second card imageUrl matches mock data', () => {
      const items = JSON.parse(wc.getAttribute('items'));
      expect(items[1].imageUrl).toBe(mockData.items[1].imageUrl);
    });

    it('passes devicetype from document.documentElement', () => {
      expect(wc.getAttribute('devicetype')).toBe('desktop');
    });
  });

  /* ── carousel ───────────────────────────────────────────────────── */
  describe('carousel block', () => {
    const mockData = mockBlocksAD.carousel;
    let wc;

    beforeAll(async () => {
      const rows = mockData.slides.map((slide) => makeRow(
        makeImgCol(slide.imageUrl, slide.imageAlt),
        makeCol(slide.contentHtml),
      ));
      decorateCarousel(makeBlock('carousel', rows));
      wc = await renderBlock('carousel');
    });

    it('creates qsr-carousel web component', () => {
      expect(wc).toBeTruthy();
      expect(wc.tagName).toBe('qsr-carousel');
    });

    it('slides count matches mock data', () => {
      const slides = JSON.parse(wc.getAttribute('slides'));
      expect(slides).toHaveLength(mockData.slides.length);
    });

    it('first slide imageUrl matches mock data', () => {
      const slides = JSON.parse(wc.getAttribute('slides'));
      expect(slides[0].imageUrl).toBe(mockData.slides[0].imageUrl);
    });

    it('first slide imageAlt matches mock data', () => {
      const slides = JSON.parse(wc.getAttribute('slides'));
      expect(slides[0].imageAlt).toBe(mockData.slides[0].imageAlt);
    });

    it('first slide contentHtml matches mock data', () => {
      const slides = JSON.parse(wc.getAttribute('slides'));
      expect(slides[0].contentHtml).toBe(mockData.slides[0].contentHtml);
    });

    it('passes devicetype from document.documentElement', () => {
      expect(wc.getAttribute('devicetype')).toBe('desktop');
    });

    it('defaults align to "left" when no align-right class', () => {
      const slides = JSON.parse(wc.getAttribute('slides'));
      expect(slides[0].align).toBe('left');
    });
  });

  /* ── hero ───────────────────────────────────────────────────────── */
  describe('hero block', () => {
    const mockItem = mockBlocksDL.hero.items[0];
    let wc;

    beforeAll(async () => {
      // hero.js expects image and content in separate rows so that
      // rows.find(r => !r.querySelector('img')) correctly identifies the
      // content row.
      const imgRow = makeImgCol(mockItem.imageUrl, mockItem.imageAlt);
      const contentRow = new MockElement('div');
      contentRow.innerHTML = mockItem.contentHtml;
      decorateHero(makeBlock('hero', [imgRow, contentRow]));
      wc = await renderBlock('hero');
    });

    it('creates qsr-hero web component', () => {
      expect(wc).toBeTruthy();
      expect(wc.tagName).toBe('qsr-hero');
    });

    it('imageurl matches mock data', () => {
      expect(wc.getAttribute('imageurl')).toBe(mockItem.imageUrl);
    });

    it('imagealt matches mock data', () => {
      expect(wc.getAttribute('imagealt')).toBe(mockItem.imageAlt);
    });

    it('contenthtml matches mock data', () => {
      expect(wc.getAttribute('contenthtml')).toBe(mockItem.contentHtml);
    });

    it('passes devicetype from document.documentElement', () => {
      expect(wc.getAttribute('devicetype')).toBe('desktop');
    });
  });

  /* ── tabs ───────────────────────────────────────────────────────── */
  describe('tabs block', () => {
    const mockData = mockBlocksSZ.tabs;
    let wc;

    beforeAll(async () => {
      const rows = mockData.items.map((tab) => makeRow(
        makeCol(tab.label),
        makeCol(tab.contentHtml),
      ));
      decorateTabs(makeBlock('tabs', rows));
      wc = await renderBlock('tabs');
    });

    it('creates qsr-tabs web component', () => {
      expect(wc).toBeTruthy();
      expect(wc.tagName).toBe('qsr-tabs');
    });

    it('tabsdata count matches mock data', () => {
      const tabsdata = JSON.parse(wc.getAttribute('tabsdata'));
      expect(tabsdata).toHaveLength(mockData.items.length);
    });

    it('first tab label matches mock data', () => {
      const tabsdata = JSON.parse(wc.getAttribute('tabsdata'));
      expect(tabsdata[0].label).toBe(mockData.items[0].label);
    });

    it('first tab contentHtml matches mock data', () => {
      const tabsdata = JSON.parse(wc.getAttribute('tabsdata'));
      expect(tabsdata[0].contentHtml).toBe(mockData.items[0].contentHtml);
    });

    it('second tab label matches mock data', () => {
      const tabsdata = JSON.parse(wc.getAttribute('tabsdata'));
      expect(tabsdata[1].label).toBe(mockData.items[1].label);
    });
  });

  /* ── table ──────────────────────────────────────────────────────── */
  describe('table block', () => {
    const mockItem = mockBlocksSZ.table.items[0];
    let wc;

    beforeAll(async () => {
      const headerRow = makeRow(...mockItem.headers.map((h) => makeCol(h)));
      const dataRows = mockItem.rows.map((row) => makeRow(...row.map((cell) => makeCol(cell))));
      decorateTable(makeBlock('table', [headerRow, ...dataRows], {
        classes: mockItem.variant === 'striped' ? ['striped'] : [],
      }));
      wc = await renderBlock('table');
    });

    it('creates qsr-table web component', () => {
      expect(wc).toBeTruthy();
      expect(wc.tagName).toBe('qsr-table');
    });

    it('tabledata has header row plus all data rows', () => {
      const tabledata = JSON.parse(wc.getAttribute('tabledata'));
      expect(tabledata).toHaveLength(1 + mockItem.rows.length);
    });

    it('header row values match mock data', () => {
      const tabledata = JSON.parse(wc.getAttribute('tabledata'));
      expect(tabledata[0]).toEqual(mockItem.headers);
    });

    it('first data row values match mock data', () => {
      const tabledata = JSON.parse(wc.getAttribute('tabledata'));
      expect(tabledata[1]).toEqual(mockItem.rows[0]);
    });

    it('hasheader defaults to "true"', () => {
      expect(wc.getAttribute('hasheader')).toBe('true');
    });

    it('striped variant is reflected in variants attribute', () => {
      expect(wc.getAttribute('variants')).toBe('striped');
    });
  });

  /* ── mock data completeness ─────────────────────────────────────── */
  describe('mock data completeness', () => {
    it('blocks-a-d.json covers accordion, alert, banner, breadcrumbs, cards, carousel', () => {
      ['accordion', 'alert', 'banner', 'breadcrumbs', 'cards', 'carousel'].forEach((name) => {
        expect(mockBlocksAD).toHaveProperty(name);
      });
    });

    it('blocks-d-l.json covers hero, header, footer, form', () => {
      ['hero', 'header', 'footer', 'form'].forEach((name) => {
        expect(mockBlocksDL).toHaveProperty(name);
      });
    });

    it('blocks-m-r.json covers modal, menu-item, pagination, product-detail', () => {
      ['modal', 'menu-item', 'pagination', 'product-detail'].forEach((name) => {
        expect(mockBlocksMR).toHaveProperty(name);
      });
    });

    it('blocks-s-z.json covers tabs, table, search, store-locator, user-profile', () => {
      ['tabs', 'table', 'search', 'store-locator', 'user-profile'].forEach((name) => {
        expect(mockBlocksSZ).toHaveProperty(name);
      });
    });

    it('accordion mock data has required items with label and body', () => {
      const { items } = mockBlocksAD.accordion;
      expect(Array.isArray(items)).toBe(true);
      items.forEach((item) => {
        expect(item).toHaveProperty('label');
        expect(item).toHaveProperty('body');
      });
    });

    it('cards mock data has required items with imageUrl, imageAlt, title, bodyHtml', () => {
      const { items } = mockBlocksAD.cards;
      expect(Array.isArray(items)).toBe(true);
      items.forEach((item) => {
        expect(item).toHaveProperty('imageUrl');
        expect(item).toHaveProperty('imageAlt');
        expect(item).toHaveProperty('title');
        expect(item).toHaveProperty('bodyHtml');
      });
    });

    it('carousel mock data has required slides with imageUrl, imageAlt, contentHtml', () => {
      const { slides } = mockBlocksAD.carousel;
      expect(Array.isArray(slides)).toBe(true);
      slides.forEach((slide) => {
        expect(slide).toHaveProperty('imageUrl');
        expect(slide).toHaveProperty('imageAlt');
        expect(slide).toHaveProperty('contentHtml');
      });
    });

    it('tabs mock data has required items with label and contentHtml', () => {
      const { items } = mockBlocksSZ.tabs;
      expect(Array.isArray(items)).toBe(true);
      items.forEach((item) => {
        expect(item).toHaveProperty('label');
        expect(item).toHaveProperty('contentHtml');
      });
    });

    it('hero mock data has required items with imageUrl, imageAlt, contentHtml', () => {
      const { items } = mockBlocksDL.hero;
      expect(Array.isArray(items)).toBe(true);
      items.forEach((item) => {
        expect(item).toHaveProperty('imageUrl');
        expect(item).toHaveProperty('imageAlt');
        expect(item).toHaveProperty('contentHtml');
      });
    });

    it('user-profile mock data has a user object with name and starsBalance', () => {
      const { user } = mockBlocksSZ['user-profile'];
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('starsBalance');
      expect(typeof user.starsBalance).toBe('number');
    });

    it('store-locator mock data has stores with id, name, address', () => {
      const { stores } = mockBlocksSZ['store-locator'];
      expect(Array.isArray(stores)).toBe(true);
      stores.forEach((store) => {
        expect(store).toHaveProperty('id');
        expect(store).toHaveProperty('name');
        expect(store).toHaveProperty('address');
      });
    });

    it('product-detail mock data has correct price format', () => {
      const { items } = mockBlocksMR['product-detail'];
      items.forEach((item) => {
        expect(item.price).toMatch(/^\$[\d.]+$/);
      });
    });

    it('rewards-feed mock data has earn and redeem entries', () => {
      const { items } = mockBlocksMR['rewards-feed'];
      const types = new Set(items.map((i) => i.type));
      expect(types.has('earn')).toBe(true);
      expect(types.has('redeem')).toBe(true);
    });
  });
});
