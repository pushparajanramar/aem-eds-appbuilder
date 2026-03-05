/**
 * UI rendering tests with mock data — all 60 components
 *
 * Validates the complete block rendering pipeline as a UI tester would:
 *   mock data → DOM structure → block decorator → web-component attributes
 *
 * For each tested block we:
 *   1. Load the relevant mock-data JSON file.
 *   2. Build a minimal in-memory DOM from that data.
 *   3. Call the block's decorate() function (with a11y.js,
 *      ue/instrumentation.js and scripts/aem.js mocked).
 *   4. Execute the captured loadComponent callback.
 *   5. Assert that the resulting web-component's attributes match
 *      the values from the mock data.
 *
 * Blocks covered: all 60 EDS blocks.
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

/**
 * Mock scripts/aem.js so blocks that import readBlockConfig, getMetadata,
 * decorateMain or loadBlock can be tested without the full AEM runtime.
 */
jest.unstable_mockModule('../scripts/aem.js', () => ({
  readBlockConfig: jest.fn(() => ({})),
  getMetadata: jest.fn(() => null),
  decorateMain: jest.fn(async () => {}),
  loadBlock: jest.fn(async () => {}),
  decorateBlocks: jest.fn(),
  decorateIcons: jest.fn(),
  loadCSS: jest.fn(),
  loadScript: jest.fn(),
  toClassName: jest.fn((s) => s.toLowerCase().replace(/\s+/g, '-')),
  toCamelCase: jest.fn((s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase())),
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
    this.className = '';
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
    if (this._children.length > 0) {
      return this._children.map((c) => {
        const attrs = Object.entries(c._attrs || {})
          .map(([k, v]) => ` ${k}="${v}"`)
          .join('');
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
    // Strip HTML tags iteratively to avoid incomplete sanitisation.
    let text = v;
    let prev;
    do { prev = text; text = text.replace(/<[^>]*>/g, ''); } while (text !== prev);
    this._textContent = text;
    this._children = [];
  }

  get textContent() {
    // When the element has DOM children (e.g. a row containing col divs),
    // return the aggregated text content of all descendants — matching real
    // DOM behaviour and allowing image.js/avatar.js to read captionCol/nameCol.
    if (this._children.length > 0) {
      return this._children.map((c) => c.textContent).join('');
    }
    return this._textContent;
  }

  set textContent(v) {
    this._textContent = String(v);
    this._innerHTML = String(v);
    // Setting textContent (including '') removes all child nodes in real DOM.
    this._children = [];
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
    if (child && typeof child === 'object') {
      child.parentElement = this;
      this._children.push(child);
    }
    return child;
  }

  append(...children) { children.forEach((c) => this.appendChild(c)); }

  replaceWith(el) { this._replacedWith = el; }

  closest(selector) {
    let node = this.parentElement;
    while (node) {
      const tag = selector.replace(/[.#\[].*/, '').toLowerCase();
      if (!tag || node.tagName === tag) return node;
      node = node.parentElement;
    }
    return null;
  }

  addEventListener() {}
  removeEventListener() {}

  /* ── CSS selector helpers ── */

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

function el(tagName, { text, html, attrs, children } = {}) {
  const elem = new MockElement(tagName);
  if (text !== undefined) elem.textContent = text;
  if (html !== undefined) elem.innerHTML = html;
  if (attrs) Object.entries(attrs).forEach(([k, v]) => elem.setAttribute(k, v));
  if (children) children.forEach((c) => elem.appendChild(c));
  return elem;
}

function makeBlock(blockName, rows, { classes = [] } = {}) {
  const block = new MockElement('div');
  block.setAttribute('data-block-name', blockName);
  block.dataset.blockName = blockName;
  classes.forEach((c) => block.classList.add(c));
  rows.forEach((r) => block.appendChild(r));
  return block;
}

function makeRow(...cols) {
  const row = new MockElement('div');
  cols.forEach((c) => row.appendChild(c));
  return row;
}

function makeCol(html = '') {
  return el('div', { html });
}

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

/* ── Import all 60 block decorators ─────────────────────────────── */

const { default: decorateAccordion } = await import('../blocks/accordion/accordion.js');
const { default: decorateAlert } = await import('../blocks/alert/alert.js');
const { default: decorateAvatar } = await import('../blocks/avatar/avatar.js');
const { default: decorateBadge } = await import('../blocks/badge/badge.js');
const { default: decorateBanner } = await import('../blocks/banner/banner.js');
const { default: decorateBreadcrumbs } = await import('../blocks/breadcrumbs/breadcrumbs.js');
const { default: decorateButton } = await import('../blocks/button/button.js');
const { default: decorateButtonGroup } = await import('../blocks/button-group/button-group.js');
const { default: decorateCalendar } = await import('../blocks/calendar/calendar.js');
const { default: decorateCards } = await import('../blocks/cards/cards.js');
const { default: decorateCarousel } = await import('../blocks/carousel/carousel.js');
const { default: decorateCheckbox } = await import('../blocks/checkbox/checkbox.js');
const { default: decorateColumns } = await import('../blocks/columns/columns.js');
const { default: decorateDatePicker } = await import('../blocks/date-picker/date-picker.js');
const { default: decorateDivider } = await import('../blocks/divider/divider.js');
const { default: decorateDrawer } = await import('../blocks/drawer/drawer.js');
const { default: decorateDropdownMenu } = await import('../blocks/dropdown-menu/dropdown-menu.js');
const { default: decorateEmbed } = await import('../blocks/embed/embed.js');
const { default: decorateFileUpload } = await import('../blocks/file-upload/file-upload.js');
const { default: decorateFooter } = await import('../blocks/footer/footer.js');
const { default: decorateForm } = await import('../blocks/form/form.js');
const { default: decorateFragment } = await import('../blocks/fragment/fragment.js');
const { default: decorateHeader } = await import('../blocks/header/header.js');
const { default: decorateHero } = await import('../blocks/hero/hero.js');
const { default: decorateIcon } = await import('../blocks/icon/icon.js');
const { default: decorateImage } = await import('../blocks/image/image.js');
const { default: decorateInputField } = await import('../blocks/input-field/input-field.js');
const { default: decorateLink } = await import('../blocks/link/link.js');
const { default: decorateList } = await import('../blocks/list/list.js');
const { default: decorateMenuItem } = await import('../blocks/menu-item/menu-item.js');
const { default: decorateModal } = await import('../blocks/modal/modal.js');
const { default: decoratePagination } = await import('../blocks/pagination/pagination.js');
const { default: decoratePopover } = await import('../blocks/popover/popover.js');
const { default: decoratePricingTable } = await import('../blocks/pricing-table/pricing-table.js');
const { default: decorateProductDetail } = await import('../blocks/product-detail/product-detail.js');
const { default: decorateProgressBar } = await import('../blocks/progress-bar/progress-bar.js');
const { default: decoratePromotionBanner } = await import('../blocks/promotion-banner/promotion-banner.js');
const { default: decorateQuote } = await import('../blocks/quote/quote.js');
const { default: decorateRadioButton } = await import('../blocks/radio-button/radio-button.js');
const { default: decorateRatingStars } = await import('../blocks/rating-stars/rating-stars.js');
const { default: decorateRewardsFeed } = await import('../blocks/rewards-feed/rewards-feed.js');
const { default: decorateSearch } = await import('../blocks/search/search.js');
const { default: decorateSelectDropdown } = await import('../blocks/select-dropdown/select-dropdown.js');
const { default: decorateSidebar } = await import('../blocks/sidebar/sidebar.js');
const { default: decorateSkeletonLoader } = await import('../blocks/skeleton-loader/skeleton-loader.js');
const { default: decorateSlider } = await import('../blocks/slider/slider.js');
const { default: decorateSpinner } = await import('../blocks/spinner/spinner.js');
const { default: decorateStepper } = await import('../blocks/stepper/stepper.js');
const { default: decorateStoreLocator } = await import('../blocks/store-locator/store-locator.js');
const { default: decorateTable } = await import('../blocks/table/table.js');
const { default: decorateTabs } = await import('../blocks/tabs/tabs.js');
const { default: decorateTag } = await import('../blocks/tag/tag.js');
const { default: decorateTestimonials } = await import('../blocks/testimonials/testimonials.js');
const { default: decorateTextarea } = await import('../blocks/textarea/textarea.js');
const { default: decorateTimeline } = await import('../blocks/timeline/timeline.js');
const { default: decorateToast } = await import('../blocks/toast/toast.js');
const { default: decorateToggleSwitch } = await import('../blocks/toggle-switch/toggle-switch.js');
const { default: decorateTooltip } = await import('../blocks/tooltip/tooltip.js');
const { default: decorateUserProfile } = await import('../blocks/user-profile/user-profile.js');
const { default: decorateVideo } = await import('../blocks/video/video.js');

/* ── Helper ──────────────────────────────────────────────────────── */

async function renderBlock(blockName) {
  const fn = loadComponentRegistry[blockName];
  return fn ? fn() : null;
}

/* ── Tests ───────────────────────────────────────────────────────── */

describe('UI rendering with mock data', () => {
  /* ── accordion ──────────────────────────────────────────────────── */
  describe('accordion block', () => {
    const mockData = mockBlocksAD.accordion;
    let wc;

    beforeAll(async () => {
      const rows = mockData.items.map((item) => makeRow(makeCol(item.label), makeCol(item.body)));
      decorateAccordion(makeBlock('accordion', rows));
      wc = await renderBlock('accordion');
    });

    it('invokes withLazyLoading', () => {
      expect(loadComponentRegistry.accordion).toBeDefined();
    });
    it('creates qsr-accordion web component', () => {
      expect(wc.tagName).toBe('qsr-accordion');
    });
    it('items count matches mock data', () => {
      expect(JSON.parse(wc.getAttribute('items'))).toHaveLength(mockData.items.length);
    });
    it('first item label matches mock data', () => {
      expect(JSON.parse(wc.getAttribute('items'))[0].label).toBe(mockData.items[0].label);
    });
    it('first item body matches mock data', () => {
      expect(JSON.parse(wc.getAttribute('items'))[0].body).toBe(mockData.items[0].body);
    });
    it('last item label matches mock data', () => {
      const items = JSON.parse(wc.getAttribute('items'));
      expect(items[items.length - 1].label).toBe(mockData.items[mockData.items.length - 1].label);
    });
  });

  /* ── alert ──────────────────────────────────────────────────────── */
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

    it('creates qsr-alert web component', () => { expect(wc.tagName).toBe('qsr-alert'); });
    it('variant matches mock data', () => { expect(wc.getAttribute('variant')).toBe(mockVariant.variant); });
    it('contenthtml matches mock data', () => { expect(wc.getAttribute('contenthtml')).toBe(mockVariant.contenthtml); });
  });

  /* ── avatar ─────────────────────────────────────────────────────── */
  describe('avatar block', () => {
    const mockItem = mockBlocksAD.avatar.items[0];
    let wc;

    beforeAll(async () => {
      // avatar.js: img row + name row (row without img)
      const imgRow = makeImgCol(mockItem.imageUrl, mockItem.imageAlt);
      const nameRow = makeRow(makeCol(mockItem.name));
      decorateAvatar(makeBlock('avatar', [imgRow, nameRow]));
      wc = await renderBlock('avatar');
    });

    it('creates qsr-avatar web component', () => { expect(wc.tagName).toBe('qsr-avatar'); });
    it('imageurl matches mock data', () => { expect(wc.getAttribute('imageurl')).toBe(mockItem.imageUrl); });
    it('imagealt matches mock data', () => { expect(wc.getAttribute('imagealt')).toBe(mockItem.imageAlt); });
    it('size defaults to "medium"', () => { expect(wc.getAttribute('size')).toBe('medium'); });
  });

  /* ── badge ──────────────────────────────────────────────────────── */
  describe('badge block', () => {
    const mockItem = mockBlocksAD.badge.items[0];
    let wc;

    beforeAll(async () => {
      decorateBadge(makeBlock('badge', [
        makeRow(makeCol(mockItem.label)),
        makeRow(makeCol(mockItem.variant)),
      ]));
      wc = await renderBlock('badge');
    });

    it('creates qsr-badge web component', () => { expect(wc.tagName).toBe('qsr-badge'); });
    it('label matches mock data', () => { expect(wc.getAttribute('label')).toBe(mockItem.label); });
    it('variant matches mock data', () => { expect(wc.getAttribute('variant')).toBe(mockItem.variant); });
  });

  /* ── banner ─────────────────────────────────────────────────────── */
  describe('banner block', () => {
    const mockItem = mockBlocksAD.banner.items[0];
    let wc;

    beforeAll(async () => {
      decorateBanner(makeBlock('banner', [
        makeRow(makeCol(mockItem.contenthtml)),
        makeRow(makeCol(mockItem.ctahtml)),
      ]));
      wc = await renderBlock('banner');
    });

    it('creates qsr-banner web component', () => { expect(wc.tagName).toBe('qsr-banner'); });
    it('contenthtml matches mock data', () => { expect(wc.getAttribute('contenthtml')).toBe(mockItem.contenthtml); });
    it('ctahtml matches mock data', () => { expect(wc.getAttribute('ctahtml')).toBe(mockItem.ctahtml); });
    it('variant defaults to "default"', () => { expect(wc.getAttribute('variant')).toBe('default'); });
  });

  describe('banner block — warning variant', () => {
    const mockItem = mockBlocksAD.banner.items[1];
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
          const link = el('a', { text: item.title, attrs: { href: item.path } });
          return makeRow(el('div', { children: [link] }));
        }
        return makeRow(makeCol(item.title));
      });
      decorateBreadcrumbs(makeBlock('breadcrumbs', rows));
      wc = await renderBlock('breadcrumbs');
    });

    it('creates qsr-breadcrumbs web component', () => { expect(wc.tagName).toBe('qsr-breadcrumbs'); });
    it('items count matches mock data', () => {
      expect(JSON.parse(wc.getAttribute('items'))).toHaveLength(mockData.items.length);
    });
    it('first item title matches mock data', () => {
      expect(JSON.parse(wc.getAttribute('items'))[0].title).toBe(mockData.items[0].title);
    });
    it('first item path matches mock data', () => {
      expect(JSON.parse(wc.getAttribute('items'))[0].path).toBe(mockData.items[0].path);
    });
    it('last item has no path (current page)', () => {
      const items = JSON.parse(wc.getAttribute('items'));
      expect(items[items.length - 1].path).toBeUndefined();
    });
  });

  /* ── button ─────────────────────────────────────────────────────── */
  describe('button block', () => {
    const mockItem = mockBlocksAD.button.variants[0]; // primary
    let wc;

    beforeAll(async () => {
      decorateButton(makeBlock('button', [
        makeRow(makeCol(mockItem.label)),
        makeRow(makeCol(mockItem.href)),
      ]));
      wc = await renderBlock('button');
    });

    it('creates qsr-button web component', () => { expect(wc.tagName).toBe('qsr-button'); });
    it('label matches mock data', () => { expect(wc.getAttribute('label')).toBe(mockItem.label); });
    it('href matches mock data', () => { expect(wc.getAttribute('href')).toBe(mockItem.href); });
    it('variant defaults to "primary"', () => { expect(wc.getAttribute('variant')).toBe('primary'); });
  });

  /* ── button-group ───────────────────────────────────────────────── */
  describe('button-group block', () => {
    const mockData = mockBlocksAD['button-group'];
    let wc;

    beforeAll(async () => {
      const rows = mockData.buttons.map((b) => makeRow(makeCol(b.label), makeCol(b.href)));
      decorateButtonGroup(makeBlock('button-group', rows));
      wc = await renderBlock('button-group');
    });

    it('creates qsr-button-group web component', () => { expect(wc.tagName).toBe('qsr-button-group'); });
    it('buttons count matches mock data', () => {
      expect(JSON.parse(wc.getAttribute('buttons'))).toHaveLength(mockData.buttons.length);
    });
    it('first button label matches mock data', () => {
      expect(JSON.parse(wc.getAttribute('buttons'))[0].label).toBe(mockData.buttons[0].label);
    });
  });

  /* ── calendar ───────────────────────────────────────────────────── */
  describe('calendar block', () => {
    const mockData = mockBlocksAD.calendar;
    let wc;

    beforeAll(async () => {
      decorateCalendar(makeBlock('calendar', [
        makeRow(makeCol(String(mockData.month))),
        makeRow(makeCol(String(mockData.year))),
      ]));
      wc = await renderBlock('calendar');
    });

    it('creates qsr-calendar web component', () => { expect(wc.tagName).toBe('qsr-calendar'); });
    it('month matches mock data', () => { expect(wc.getAttribute('month')).toBe(String(mockData.month)); });
    it('year matches mock data', () => { expect(wc.getAttribute('year')).toBe(String(mockData.year)); });
  });

  /* ── cards ──────────────────────────────────────────────────────── */
  describe('cards block', () => {
    const mockData = mockBlocksAD.cards;
    let wc;

    beforeAll(async () => {
      const rows = mockData.items.map((item) => {
        const imgCol = makeImgCol(item.imageUrl, item.imageAlt);
        const heading = el('h3', { text: item.title });
        const contentCol = new MockElement('div');
        contentCol.appendChild(heading);
        return makeRow(imgCol, contentCol);
      });
      decorateCards(makeBlock('cards', rows));
      wc = await renderBlock('cards');
    });

    it('creates qsr-cards web component', () => { expect(wc.tagName).toBe('qsr-cards'); });
    it('items count matches mock data', () => {
      expect(JSON.parse(wc.getAttribute('items'))).toHaveLength(mockData.items.length);
    });
    it('first card imageUrl matches mock data', () => {
      expect(JSON.parse(wc.getAttribute('items'))[0].imageUrl).toBe(mockData.items[0].imageUrl);
    });
    it('first card title matches mock data', () => {
      expect(JSON.parse(wc.getAttribute('items'))[0].title).toBe(mockData.items[0].title);
    });
    it('passes devicetype from documentElement', () => {
      expect(wc.getAttribute('devicetype')).toBe('desktop');
    });
  });

  /* ── carousel ───────────────────────────────────────────────────── */
  describe('carousel block', () => {
    const mockData = mockBlocksAD.carousel;
    let wc;

    beforeAll(async () => {
      const rows = mockData.slides.map((s) => makeRow(
        makeImgCol(s.imageUrl, s.imageAlt),
        makeCol(s.contentHtml),
      ));
      decorateCarousel(makeBlock('carousel', rows));
      wc = await renderBlock('carousel');
    });

    it('creates qsr-carousel web component', () => { expect(wc.tagName).toBe('qsr-carousel'); });
    it('slides count matches mock data', () => {
      expect(JSON.parse(wc.getAttribute('slides'))).toHaveLength(mockData.slides.length);
    });
    it('first slide imageUrl matches mock data', () => {
      expect(JSON.parse(wc.getAttribute('slides'))[0].imageUrl).toBe(mockData.slides[0].imageUrl);
    });
    it('passes devicetype from documentElement', () => {
      expect(wc.getAttribute('devicetype')).toBe('desktop');
    });
    it('defaults align to "left"', () => {
      expect(JSON.parse(wc.getAttribute('slides'))[0].align).toBe('left');
    });
  });

  /* ── checkbox ───────────────────────────────────────────────────── */
  describe('checkbox block', () => {
    const mockData = mockBlocksAD.checkbox;
    let wc;

    beforeAll(async () => {
      const rows = mockData.items.map((i) => makeRow(makeCol(i.label), makeCol(i.value)));
      decorateCheckbox(makeBlock('checkbox', rows));
      wc = await renderBlock('checkbox');
    });

    it('creates qsr-checkbox web component', () => { expect(wc.tagName).toBe('qsr-checkbox'); });
    it('items count matches mock data', () => {
      expect(JSON.parse(wc.getAttribute('items'))).toHaveLength(mockData.items.length);
    });
    it('first item label matches mock data', () => {
      expect(JSON.parse(wc.getAttribute('items'))[0].label).toBe(mockData.items[0].label);
    });
  });

  /* ── columns ────────────────────────────────────────────────────── */
  describe('columns block', () => {
    const mockData = mockBlocksAD.columns;
    let wc;

    beforeAll(async () => {
      // columns.js flatMaps rows → each row's children become columndata entries
      const [textItem, imgItem] = mockData.items;
      const row = makeRow(makeCol(textItem.contentHtml), makeImgCol(imgItem.imageUrl, imgItem.imageAlt));
      decorateColumns(makeBlock('columns', [row]));
      wc = await renderBlock('columns');
    });

    it('creates qsr-columns web component', () => { expect(wc.tagName).toBe('qsr-columns'); });
    it('columndata has 2 entries', () => {
      expect(JSON.parse(wc.getAttribute('columndata'))).toHaveLength(2);
    });
    it('image column isImage flag is true', () => {
      const cols = JSON.parse(wc.getAttribute('columndata'));
      const imageCol = cols.find((c) => c.isImage);
      expect(imageCol).toBeDefined();
    });
    it('passes devicetype', () => { expect(wc.getAttribute('devicetype')).toBe('desktop'); });
  });

  /* ── date-picker ────────────────────────────────────────────────── */
  describe('date-picker block', () => {
    const mockData = mockBlocksAD['date-picker'];
    let wc;

    beforeAll(async () => {
      decorateDatePicker(makeBlock('date-picker', [
        makeRow(makeCol(mockData.label)),
        makeRow(makeCol(mockData.placeholder)),
      ]));
      wc = await renderBlock('date-picker');
    });

    it('creates qsr-date-picker web component', () => { expect(wc.tagName).toBe('qsr-date-picker'); });
    it('label matches mock data', () => { expect(wc.getAttribute('label')).toBe(mockData.label); });
    it('placeholder matches mock data', () => { expect(wc.getAttribute('placeholder')).toBe(mockData.placeholder); });
  });

  /* ── divider ────────────────────────────────────────────────────── */
  describe('divider block', () => {
    const mockVariant = mockBlocksAD.divider.variants[0]; // solid, no label
    let wc;

    beforeAll(async () => {
      decorateDivider(makeBlock('divider', [makeRow(makeCol(mockVariant.label))]));
      wc = await renderBlock('divider');
    });

    it('creates qsr-divider web component', () => { expect(wc.tagName).toBe('qsr-divider'); });
    it('variant defaults to "solid"', () => { expect(wc.getAttribute('variant')).toBe('solid'); });
  });

  /* ── drawer ─────────────────────────────────────────────────────── */
  describe('drawer block', () => {
    const mockItem = mockBlocksDL.drawer.items[0];
    let wc;

    beforeAll(async () => {
      decorateDrawer(makeBlock('drawer', [
        makeRow(makeCol(mockItem.title)),
        makeRow(makeCol(mockItem.contentHtml)),
      ]));
      wc = await renderBlock('drawer');
    });

    it('creates qsr-drawer web component', () => { expect(wc.tagName).toBe('qsr-drawer'); });
    it('title matches mock data', () => { expect(wc.getAttribute('title')).toBe(mockItem.title); });
    it('position defaults to "left"', () => { expect(wc.getAttribute('position')).toBe('left'); });
  });

  /* ── dropdown-menu ──────────────────────────────────────────────── */
  describe('dropdown-menu block', () => {
    const mockItem = mockBlocksDL['dropdown-menu'].items[0];
    let wc;

    beforeAll(async () => {
      const rows = [
        makeRow(makeCol(mockItem.trigger)),
        ...mockItem.menuItems.map((m) => makeRow(makeCol(m.label), makeCol(m.href))),
      ];
      decorateDropdownMenu(makeBlock('dropdown-menu', rows));
      wc = await renderBlock('dropdown-menu');
    });

    it('creates qsr-dropdown-menu web component', () => { expect(wc.tagName).toBe('qsr-dropdown-menu'); });
    it('trigger matches mock data', () => { expect(wc.getAttribute('trigger')).toBe(mockItem.trigger); });
    it('items count matches mock data', () => {
      expect(JSON.parse(wc.getAttribute('items'))).toHaveLength(mockItem.menuItems.length);
    });
  });

  /* ── embed ──────────────────────────────────────────────────────── */
  describe('embed block', () => {
    const mockItem = mockBlocksDL.embed.items[0]; // youtube
    let wc;

    beforeAll(async () => {
      const link = el('a', { attrs: { href: mockItem.src } });
      const row = new MockElement('div');
      row.appendChild(link);
      decorateEmbed(makeBlock('embed', [row]));
      wc = await renderBlock('embed');
    });

    it('creates qsr-embed web component', () => { expect(wc.tagName).toBe('qsr-embed'); });
    it('src matches mock data', () => { expect(wc.getAttribute('src')).toBe(mockItem.src); });
    it('provider is detected as youtube', () => { expect(wc.getAttribute('provider')).toBe('youtube'); });
  });

  /* ── file-upload ────────────────────────────────────────────────── */
  describe('file-upload block', () => {
    const mockData = mockBlocksDL['file-upload'];
    let wc;

    beforeAll(async () => {
      decorateFileUpload(makeBlock('file-upload', [
        makeRow(makeCol(mockData.label)),
        makeRow(makeCol(mockData.accept)),
      ]));
      wc = await renderBlock('file-upload');
    });

    it('creates qsr-file-upload web component', () => { expect(wc.tagName).toBe('qsr-file-upload'); });
    it('label matches mock data', () => { expect(wc.getAttribute('label')).toBe(mockData.label); });
    it('accept matches mock data', () => { expect(wc.getAttribute('accept')).toBe(mockData.accept); });
  });

  /* ── footer ─────────────────────────────────────────────────────── */
  describe('footer block', () => {
    let wc;

    beforeAll(async () => {
      // getMetadata mock returns null → path defaults to '/footer'
      await decorateFooter(makeBlock('footer', []));
      wc = await renderBlock('footer');
    });

    it('creates qsr-footer web component', () => { expect(wc.tagName).toBe('qsr-footer'); });
    it('path defaults to "/footer" when no footer metadata', () => {
      expect(wc.getAttribute('path')).toBe('/footer');
    });
  });

  /* ── form ───────────────────────────────────────────────────────── */
  describe('form block', () => {
    const mockData = mockBlocksDL.form;
    let wc;

    beforeAll(async () => {
      // Build an action row only (simple case)
      decorateForm(makeBlock('form', [
        makeRow(makeCol('action'), makeCol(mockData.action)),
      ]));
      wc = await renderBlock('form');
    });

    it('creates qsr-form web component', () => { expect(wc.tagName).toBe('qsr-form'); });
    it('action matches mock data', () => { expect(wc.getAttribute('action')).toBe(mockData.action); });
    it('fields is a JSON array', () => {
      expect(Array.isArray(JSON.parse(wc.getAttribute('fields')))).toBe(true);
    });
  });

  /* ── fragment ───────────────────────────────────────────────────── */
  describe('fragment block', () => {
    const mockData = mockBlocksDL.fragment;
    let wc;

    beforeAll(async () => {
      const link = el('a', { attrs: { href: mockData.path } });
      const row = new MockElement('div');
      row.appendChild(link);
      decorateFragment(makeBlock('fragment', [row]));
      wc = await renderBlock('fragment');
    });

    it('creates qsr-fragment web component', () => { expect(wc.tagName).toBe('qsr-fragment'); });
    it('path matches mock data', () => { expect(wc.getAttribute('path')).toBe(mockData.path); });
  });

  /* ── header (special — no withLazyLoading) ──────────────────────── */
  describe('header block', () => {
    let block;

    beforeAll(async () => {
      block = makeBlock('header', []);
      await decorateHeader(block);
    });

    it('sets role="banner" on block', () => {
      expect(block.getAttribute('role')).toBe('banner');
    });
    it('sets aria-label="Header" on block', () => {
      expect(block.getAttribute('aria-label')).toBe('Header');
    });
    it('replaces block with qsr-header web component', () => {
      expect(block._replacedWith).toBeDefined();
      expect(block._replacedWith.tagName).toBe('qsr-header');
    });
    it('qsr-header path defaults to "/nav"', () => {
      expect(block._replacedWith.getAttribute('path')).toBe('/nav');
    });
  });

  /* ── hero ───────────────────────────────────────────────────────── */
  describe('hero block', () => {
    const mockItem = mockBlocksDL.hero.items[0];
    let wc;

    beforeAll(async () => {
      const imgRow = makeImgCol(mockItem.imageUrl, mockItem.imageAlt);
      const contentRow = new MockElement('div');
      contentRow.innerHTML = mockItem.contentHtml;
      decorateHero(makeBlock('hero', [imgRow, contentRow]));
      wc = await renderBlock('hero');
    });

    it('creates qsr-hero web component', () => { expect(wc.tagName).toBe('qsr-hero'); });
    it('imageurl matches mock data', () => { expect(wc.getAttribute('imageurl')).toBe(mockItem.imageUrl); });
    it('imagealt matches mock data', () => { expect(wc.getAttribute('imagealt')).toBe(mockItem.imageAlt); });
    it('contenthtml matches mock data', () => { expect(wc.getAttribute('contenthtml')).toBe(mockItem.contentHtml); });
    it('passes devicetype', () => { expect(wc.getAttribute('devicetype')).toBe('desktop'); });
  });

  /* ── icon ───────────────────────────────────────────────────────── */
  describe('icon block', () => {
    const mockItem = mockBlocksDL.icon.items[0];
    let wc;

    beforeAll(async () => {
      decorateIcon(makeBlock('icon', [
        makeRow(makeCol(mockItem.name)),
        makeRow(makeCol(mockItem.size)),
      ]));
      wc = await renderBlock('icon');
    });

    it('creates qsr-icon web component', () => { expect(wc.tagName).toBe('qsr-icon'); });
    it('name matches mock data', () => { expect(wc.getAttribute('name')).toBe(mockItem.name); });
    it('size matches mock data', () => { expect(wc.getAttribute('size')).toBe(mockItem.size); });
  });

  /* ── image ──────────────────────────────────────────────────────── */
  describe('image block', () => {
    const mockItem = mockBlocksDL.image.items[0];
    let wc;

    beforeAll(async () => {
      // Row 0: image column; Row 1: caption (no img → captionCol)
      const imgRow = makeImgCol(mockItem.imageUrl, mockItem.imageAlt);
      const captionRow = makeRow(makeCol(mockItem.caption));
      decorateImage(makeBlock('image', [imgRow, captionRow]));
      wc = await renderBlock('image');
    });

    it('creates qsr-image web component', () => { expect(wc.tagName).toBe('qsr-image'); });
    it('imageurl matches mock data', () => { expect(wc.getAttribute('imageurl')).toBe(mockItem.imageUrl); });
    it('imagealt matches mock data', () => { expect(wc.getAttribute('imagealt')).toBe(mockItem.imageAlt); });
    it('caption matches mock data', () => { expect(wc.getAttribute('caption')).toBe(mockItem.caption); });
  });

  /* ── input-field ────────────────────────────────────────────────── */
  describe('input-field block', () => {
    const mockItem = mockBlocksDL['input-field'].items[0];
    let wc;

    beforeAll(async () => {
      decorateInputField(makeBlock('input-field', [
        makeRow(makeCol(mockItem.label)),
        makeRow(makeCol(mockItem.placeholder)),
        makeRow(makeCol(mockItem.type)),
      ]));
      wc = await renderBlock('input-field');
    });

    it('creates qsr-input-field web component', () => { expect(wc.tagName).toBe('qsr-input-field'); });
    it('label matches mock data', () => { expect(wc.getAttribute('label')).toBe(mockItem.label); });
    it('placeholder matches mock data', () => { expect(wc.getAttribute('placeholder')).toBe(mockItem.placeholder); });
    it('inputtype matches mock data', () => { expect(wc.getAttribute('inputtype')).toBe(mockItem.type); });
  });

  /* ── link ───────────────────────────────────────────────────────── */
  describe('link block', () => {
    const mockItem = mockBlocksDL.link.items[0];
    let wc;

    beforeAll(async () => {
      decorateLink(makeBlock('link', [
        makeRow(makeCol(mockItem.label)),
        makeRow(makeCol(mockItem.href)),
      ]));
      wc = await renderBlock('link');
    });

    it('creates qsr-link web component', () => { expect(wc.tagName).toBe('qsr-link'); });
    it('label matches mock data', () => { expect(wc.getAttribute('label')).toBe(mockItem.label); });
    it('href matches mock data', () => { expect(wc.getAttribute('href')).toBe(mockItem.href); });
    it('variant defaults to "default"', () => { expect(wc.getAttribute('variant')).toBe('default'); });
  });

  /* ── list ───────────────────────────────────────────────────────── */
  describe('list block', () => {
    const mockGroup = mockBlocksDL.list.items[0]; // unordered
    let wc;

    beforeAll(async () => {
      const rows = mockGroup.items.map((text) => makeRow(makeCol(text)));
      decorateList(makeBlock('list', rows));
      wc = await renderBlock('list');
    });

    it('creates qsr-list web component', () => { expect(wc.tagName).toBe('qsr-list'); });
    it('items count matches mock data', () => {
      expect(JSON.parse(wc.getAttribute('items'))).toHaveLength(mockGroup.items.length);
    });
    it('variant defaults to "unordered"', () => { expect(wc.getAttribute('variant')).toBe('unordered'); });
  });

  /* ── menu-item (uses readBlockConfig + Object.assign) ────────────── */
  describe('menu-item block', () => {
    const mockItem = mockBlocksMR['menu-item'].items[0];
    let wc;

    beforeAll(async () => {
      await decorateMenuItem(makeBlock('menu-item', []));
      wc = await renderBlock('menu-item');
    });

    it('creates qsr-menu-card web component', () => { expect(wc.tagName).toBe('qsr-menu-card'); });
    it('market defaults to "us"', () => { expect(wc.market).toBe('us'); });
    it('category defaults to "drinks"', () => { expect(wc.category).toBe('drinks'); });
  });

  /* ── modal (special — event-listener pattern, no loadComponent) ─── */
  describe('modal block', () => {
    it('decorate runs without error when no trigger present', () => {
      expect(() => decorateModal(makeBlock('modal', []))).not.toThrow();
    });

    it('decorate runs without error when trigger link is present', () => {
      const link = el('a', { text: 'Open', attrs: { href: '/fragment' } });
      const row = new MockElement('div');
      row.appendChild(link);
      expect(() => decorateModal(makeBlock('modal', [row]))).not.toThrow();
    });
  });

  /* ── pagination ─────────────────────────────────────────────────── */
  describe('pagination block', () => {
    const mockData = mockBlocksMR.pagination;
    let wc;

    beforeAll(async () => {
      decoratePagination(makeBlock('pagination', [
        makeRow(makeCol(String(mockData.total))),
        makeRow(makeCol(String(mockData.current))),
      ]));
      wc = await renderBlock('pagination');
    });

    it('creates qsr-pagination web component', () => { expect(wc.tagName).toBe('qsr-pagination'); });
    it('total matches mock data', () => { expect(wc.getAttribute('total')).toBe(String(mockData.total)); });
    it('current matches mock data', () => { expect(wc.getAttribute('current')).toBe(String(mockData.current)); });
  });

  /* ── popover ────────────────────────────────────────────────────── */
  describe('popover block', () => {
    const mockItem = mockBlocksMR.popover.items[0];
    let wc;

    beforeAll(async () => {
      decoratePopover(makeBlock('popover', [
        makeRow(makeCol(mockItem.triggerhtml)),
        makeRow(makeCol(mockItem.contenthtml)),
      ], { classes: [mockItem.placement] }));
      wc = await renderBlock('popover');
    });

    it('creates qsr-popover web component', () => { expect(wc.tagName).toBe('qsr-popover'); });
    it('triggerhtml matches mock data', () => {
      expect(wc.getAttribute('triggerhtml')).toBe(mockItem.triggerhtml);
    });
    it('placement matches mock data', () => { expect(wc.getAttribute('placement')).toBe(mockItem.placement); });
  });

  /* ── pricing-table ──────────────────────────────────────────────── */
  describe('pricing-table block', () => {
    const mockData = mockBlocksMR['pricing-table'];
    let wc;

    beforeAll(async () => {
      const rows = mockData.plans.map((p) => makeRow(
        makeCol(p.name),
        makeCol(p.price),
        makeCol(p.features.join(', ')),
        makeCol(p.ctahtml),
      ));
      decoratePricingTable(makeBlock('pricing-table', rows));
      wc = await renderBlock('pricing-table');
    });

    it('creates qsr-pricing-table web component', () => { expect(wc.tagName).toBe('qsr-pricing-table'); });
    it('plans count matches mock data', () => {
      expect(JSON.parse(wc.getAttribute('plans'))).toHaveLength(mockData.plans.length);
    });
    it('first plan name matches mock data', () => {
      expect(JSON.parse(wc.getAttribute('plans'))[0].name).toBe(mockData.plans[0].name);
    });
  });

  /* ── product-detail (uses readBlockConfig + Object.assign) ────────── */
  describe('product-detail block', () => {
    let wc;

    beforeAll(async () => {
      await decorateProductDetail(makeBlock('product-detail', []));
      wc = await renderBlock('product-detail');
    });

    it('creates qsr-product-customizer web component', () => {
      expect(wc.tagName).toBe('qsr-product-customizer');
    });
    it('market defaults to "us"', () => { expect(wc.market).toBe('us'); });
  });

  /* ── progress-bar ───────────────────────────────────────────────── */
  describe('progress-bar block', () => {
    const mockItem = mockBlocksMR['progress-bar'].items[0];
    let wc;

    beforeAll(async () => {
      decorateProgressBar(makeBlock('progress-bar', [
        makeRow(makeCol(mockItem.label)),
        makeRow(makeCol(String(mockItem.value))),
      ]));
      wc = await renderBlock('progress-bar');
    });

    it('creates qsr-progress-bar web component', () => { expect(wc.tagName).toBe('qsr-progress-bar'); });
    it('label matches mock data', () => { expect(wc.getAttribute('label')).toBe(mockItem.label); });
    it('value matches mock data', () => { expect(wc.getAttribute('value')).toBe(String(mockItem.value)); });
  });

  /* ── promotion-banner (special — DOM restructure, no withLazyLoading) */
  describe('promotion-banner block', () => {
    const mockItem = mockBlocksMR['promotion-banner'].items[0];
    let block;

    beforeAll(async () => {
      // rows: title row (h2), description row (p), cta row (a)
      const titleEl = el('h2', { text: mockItem.title });
      const descEl = el('p', { text: mockItem.description });
      const ctaEl = el('a', { text: mockItem.ctaText, attrs: { href: mockItem.ctaLink } });
      block = makeBlock('promotion-banner', [
        makeRow(el('div', { children: [titleEl] })),
        makeRow(el('div', { children: [descEl] })),
        makeRow(el('div', { children: [ctaEl] })),
      ]);
      await decoratePromotionBanner(block);
    });

    it('sets role="banner" on the block', () => {
      expect(block.getAttribute('role')).toBe('banner');
    });
    it('sets aria-label="Promotion" on the block', () => {
      expect(block.getAttribute('aria-label')).toBe('Promotion');
    });
    it('appends promotion-banner__inner wrapper', () => {
      const inner = block._children.find((c) => c.className === 'promotion-banner__inner');
      expect(inner).toBeDefined();
    });
  });

  /* ── quote ──────────────────────────────────────────────────────── */
  describe('quote block', () => {
    const mockItem = mockBlocksMR.quote.items[0];
    let wc;

    beforeAll(async () => {
      decorateQuote(makeBlock('quote', [
        makeRow(makeCol(mockItem.quotehtml)),
        makeRow(makeCol(mockItem.attributionhtml)),
      ]));
      wc = await renderBlock('quote');
    });

    it('creates qsr-quote web component', () => { expect(wc.tagName).toBe('qsr-quote'); });
    it('quotation matches mock data', () => { expect(wc.getAttribute('quotation')).toBe(mockItem.quotehtml); });
    it('attribution matches mock data', () => { expect(wc.getAttribute('attribution')).toBe(mockItem.attributionhtml); });
  });

  /* ── radio-button ───────────────────────────────────────────────── */
  describe('radio-button block', () => {
    const mockGroup = mockBlocksMR['radio-button'].items[0];
    let wc;

    beforeAll(async () => {
      const rows = mockGroup.options.map((o) => makeRow(makeCol(o.label), makeCol(o.value)));
      decorateRadioButton(makeBlock('radio-button', rows));
      wc = await renderBlock('radio-button');
    });

    it('creates qsr-radio-button web component', () => { expect(wc.tagName).toBe('qsr-radio-button'); });
    it('items count matches mock data', () => {
      expect(JSON.parse(wc.getAttribute('items'))).toHaveLength(mockGroup.options.length);
    });
    it('first item label matches mock data', () => {
      expect(JSON.parse(wc.getAttribute('items'))[0].label).toBe(mockGroup.options[0].label);
    });
  });

  /* ── rating-stars ───────────────────────────────────────────────── */
  describe('rating-stars block', () => {
    const mockItem = mockBlocksMR['rating-stars'].items[0];
    let wc;

    beforeAll(async () => {
      decorateRatingStars(makeBlock('rating-stars', [
        makeRow(makeCol(String(mockItem.value))),
        makeRow(makeCol(String(mockItem.max))),
      ]));
      wc = await renderBlock('rating-stars');
    });

    it('creates qsr-rating-stars web component', () => { expect(wc.tagName).toBe('qsr-rating-stars'); });
    it('value matches mock data', () => { expect(wc.getAttribute('value')).toBe(String(mockItem.value)); });
    it('max matches mock data', () => { expect(wc.getAttribute('max')).toBe(String(mockItem.max)); });
    it('readonly defaults to "false"', () => { expect(wc.getAttribute('readonly')).toBe('false'); });
  });

  /* ── rewards-feed (uses readBlockConfig + Object.assign) ─────────── */
  describe('rewards-feed block', () => {
    const mockData = mockBlocksMR['rewards-feed'];
    let wc;

    beforeAll(async () => {
      await decorateRewardsFeed(makeBlock('rewards-feed', []));
      wc = await renderBlock('rewards-feed');
    });

    it('creates qsr-rewards-feed web component', () => { expect(wc.tagName).toBe('qsr-rewards-feed'); });
    it('market defaults to "us"', () => { expect(wc.market).toBe('us'); });
    it('limit defaults to "20"', () => { expect(wc.limit).toBe('20'); });
  });

  /* ── search ─────────────────────────────────────────────────────── */
  describe('search block', () => {
    let wc;

    beforeAll(async () => {
      decorateSearch(makeBlock('search', []));
      wc = await renderBlock('search');
    });

    it('creates qsr-search web component', () => { expect(wc.tagName).toBe('qsr-search'); });
    it('invokes withLazyLoading', () => { expect(loadComponentRegistry.search).toBeDefined(); });
  });

  /* ── select-dropdown ────────────────────────────────────────────── */
  describe('select-dropdown block', () => {
    const mockItem = mockBlocksSZ['select-dropdown'].items[0];
    let wc;

    beforeAll(async () => {
      const rows = [
        makeRow(makeCol(mockItem.label)),
        ...mockItem.options.map((o) => makeRow(makeCol(o))),
      ];
      decorateSelectDropdown(makeBlock('select-dropdown', rows));
      wc = await renderBlock('select-dropdown');
    });

    it('creates qsr-select-dropdown web component', () => { expect(wc.tagName).toBe('qsr-select-dropdown'); });
    it('label matches mock data', () => { expect(wc.getAttribute('label')).toBe(mockItem.label); });
    it('options count matches mock data', () => {
      expect(JSON.parse(wc.getAttribute('options'))).toHaveLength(mockItem.options.length);
    });
    it('first option matches mock data', () => {
      expect(JSON.parse(wc.getAttribute('options'))[0]).toBe(mockItem.options[0]);
    });
  });

  /* ── sidebar ────────────────────────────────────────────────────── */
  describe('sidebar block', () => {
    const mockData = mockBlocksSZ.sidebar;
    let wc;

    beforeAll(async () => {
      const rows = mockData.items.map((i) => makeRow(makeCol(i.label), makeCol(i.href)));
      decorateSidebar(makeBlock('sidebar', rows));
      wc = await renderBlock('sidebar');
    });

    it('creates qsr-sidebar web component', () => { expect(wc.tagName).toBe('qsr-sidebar'); });
    it('items count matches mock data', () => {
      expect(JSON.parse(wc.getAttribute('items'))).toHaveLength(mockData.items.length);
    });
    it('first item label matches mock data', () => {
      expect(JSON.parse(wc.getAttribute('items'))[0].label).toBe(mockData.items[0].label);
    });
  });

  /* ── skeleton-loader ────────────────────────────────────────────── */
  describe('skeleton-loader block', () => {
    const mockItem = mockBlocksSZ['skeleton-loader'].items[0];
    let wc;

    beforeAll(async () => {
      decorateSkeletonLoader(makeBlock('skeleton-loader', [
        makeRow(makeCol(mockItem.type)),
        makeRow(makeCol(String(mockItem.lines))),
      ]));
      wc = await renderBlock('skeleton-loader');
    });

    it('creates qsr-skeleton-loader web component', () => { expect(wc.tagName).toBe('qsr-skeleton-loader'); });
    it('skeletontype matches mock data', () => { expect(wc.getAttribute('skeletontype')).toBe(mockItem.type); });
    it('count matches mock data', () => { expect(wc.getAttribute('count')).toBe(String(mockItem.lines)); });
  });

  /* ── slider ─────────────────────────────────────────────────────── */
  describe('slider block', () => {
    const mockItem = mockBlocksSZ.slider.items[0];
    let wc;

    beforeAll(async () => {
      decorateSlider(makeBlock('slider', [
        makeRow(makeCol(mockItem.label)),
        makeRow(makeCol(String(mockItem.min))),
        makeRow(makeCol(String(mockItem.max))),
        makeRow(makeCol(String(mockItem.value))),
      ]));
      wc = await renderBlock('slider');
    });

    it('creates qsr-slider web component', () => { expect(wc.tagName).toBe('qsr-slider'); });
    it('label matches mock data', () => { expect(wc.getAttribute('label')).toBe(mockItem.label); });
    it('min matches mock data', () => { expect(wc.getAttribute('min')).toBe(String(mockItem.min)); });
    it('max matches mock data', () => { expect(wc.getAttribute('max')).toBe(String(mockItem.max)); });
    it('value matches mock data', () => { expect(wc.getAttribute('value')).toBe(String(mockItem.value)); });
  });

  /* ── spinner ────────────────────────────────────────────────────── */
  describe('spinner block', () => {
    const mockItem = mockBlocksSZ.spinner.items[0];
    let wc;

    beforeAll(async () => {
      decorateSpinner(makeBlock('spinner', [makeRow(makeCol(mockItem.label))]));
      wc = await renderBlock('spinner');
    });

    it('creates qsr-spinner web component', () => { expect(wc.tagName).toBe('qsr-spinner'); });
    it('label matches mock data', () => { expect(wc.getAttribute('label')).toBe(mockItem.label); });
    it('size defaults to "medium"', () => { expect(wc.getAttribute('size')).toBe('medium'); });
  });

  /* ── stepper ────────────────────────────────────────────────────── */
  describe('stepper block', () => {
    const mockGroup = mockBlocksSZ.stepper.items[0];
    let wc;

    beforeAll(async () => {
      const block = makeBlock('stepper', mockGroup.steps.map((s) => makeRow(makeCol(s.label), makeCol(s.description))));
      block.dataset.current = String(mockGroup.current);
      decorateStepper(block);
      wc = await renderBlock('stepper');
    });

    it('creates qsr-stepper web component', () => { expect(wc.tagName).toBe('qsr-stepper'); });
    it('steps count matches mock data', () => {
      expect(JSON.parse(wc.getAttribute('steps'))).toHaveLength(mockGroup.steps.length);
    });
    it('first step label matches mock data', () => {
      expect(JSON.parse(wc.getAttribute('steps'))[0].label).toBe(mockGroup.steps[0].label);
    });
    it('current step matches mock data', () => {
      expect(wc.getAttribute('current')).toBe(String(mockGroup.current));
    });
  });

  /* ── store-locator (uses readBlockConfig + Object.assign) ─────────── */
  describe('store-locator block', () => {
    let wc;

    beforeAll(async () => {
      await decorateStoreLocator(makeBlock('store-locator', []));
      wc = await renderBlock('store-locator');
    });

    it('creates qsr-store-locator web component', () => { expect(wc.tagName).toBe('qsr-store-locator'); });
    it('market defaults to "us"', () => { expect(wc.market).toBe('us'); });
    it('radius defaults to "5"', () => { expect(wc.radius).toBe('5'); });
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

    it('creates qsr-table web component', () => { expect(wc.tagName).toBe('qsr-table'); });
    it('tabledata has header row plus all data rows', () => {
      expect(JSON.parse(wc.getAttribute('tabledata'))).toHaveLength(1 + mockItem.rows.length);
    });
    it('header row values match mock data', () => {
      expect(JSON.parse(wc.getAttribute('tabledata'))[0]).toEqual(mockItem.headers);
    });
    it('first data row values match mock data', () => {
      expect(JSON.parse(wc.getAttribute('tabledata'))[1]).toEqual(mockItem.rows[0]);
    });
    it('hasheader defaults to "true"', () => { expect(wc.getAttribute('hasheader')).toBe('true'); });
    it('striped variant reflected in variants attribute', () => {
      expect(wc.getAttribute('variants')).toBe('striped');
    });
  });

  /* ── tabs ───────────────────────────────────────────────────────── */
  describe('tabs block', () => {
    const mockData = mockBlocksSZ.tabs;
    let wc;

    beforeAll(async () => {
      const rows = mockData.items.map((t) => makeRow(makeCol(t.label), makeCol(t.contentHtml)));
      decorateTabs(makeBlock('tabs', rows));
      wc = await renderBlock('tabs');
    });

    it('creates qsr-tabs web component', () => { expect(wc.tagName).toBe('qsr-tabs'); });
    it('tabsdata count matches mock data', () => {
      expect(JSON.parse(wc.getAttribute('tabsdata'))).toHaveLength(mockData.items.length);
    });
    it('first tab label matches mock data', () => {
      expect(JSON.parse(wc.getAttribute('tabsdata'))[0].label).toBe(mockData.items[0].label);
    });
    it('first tab contentHtml matches mock data', () => {
      expect(JSON.parse(wc.getAttribute('tabsdata'))[0].contentHtml).toBe(mockData.items[0].contentHtml);
    });
  });

  /* ── tag ────────────────────────────────────────────────────────── */
  describe('tag block', () => {
    const mockData = mockBlocksSZ.tag;
    let wc;

    beforeAll(async () => {
      const rows = mockData.items.map((i) => makeRow(makeCol(i.label), makeCol(i.variant)));
      decorateTag(makeBlock('tag', rows));
      wc = await renderBlock('tag');
    });

    it('creates qsr-tag web component', () => { expect(wc.tagName).toBe('qsr-tag'); });
    it('items count matches mock data', () => {
      expect(JSON.parse(wc.getAttribute('items'))).toHaveLength(mockData.items.length);
    });
    it('first tag label matches mock data', () => {
      expect(JSON.parse(wc.getAttribute('items'))[0].label).toBe(mockData.items[0].label);
    });
  });

  /* ── testimonials ───────────────────────────────────────────────── */
  describe('testimonials block', () => {
    const mockData = mockBlocksSZ.testimonials;
    let wc;

    beforeAll(async () => {
      const rows = mockData.items.map((i) => makeRow(makeCol(i.quote), makeCol(i.author)));
      decorateTestimonials(makeBlock('testimonials', rows));
      wc = await renderBlock('testimonials');
    });

    it('creates qsr-testimonials web component', () => { expect(wc.tagName).toBe('qsr-testimonials'); });
    it('items count matches mock data', () => {
      expect(JSON.parse(wc.getAttribute('items'))).toHaveLength(mockData.items.length);
    });
    it('first item author matches mock data', () => {
      expect(JSON.parse(wc.getAttribute('items'))[0].author).toBe(mockData.items[0].author);
    });
  });

  /* ── textarea ───────────────────────────────────────────────────── */
  describe('textarea block', () => {
    const mockData = mockBlocksSZ.textarea;
    let wc;

    beforeAll(async () => {
      decorateTextarea(makeBlock('textarea', [
        makeRow(makeCol(mockData.label)),
        makeRow(makeCol(mockData.placeholder)),
      ]));
      wc = await renderBlock('textarea');
    });

    it('creates qsr-textarea web component', () => { expect(wc.tagName).toBe('qsr-textarea'); });
    it('label matches mock data', () => { expect(wc.getAttribute('label')).toBe(mockData.label); });
    it('placeholder matches mock data', () => { expect(wc.getAttribute('placeholder')).toBe(mockData.placeholder); });
  });

  /* ── timeline ───────────────────────────────────────────────────── */
  describe('timeline block', () => {
    const mockData = mockBlocksSZ.timeline;
    let wc;

    beforeAll(async () => {
      const rows = mockData.items.map((i) => makeRow(makeCol(i.date), makeCol(i.contentHtml)));
      decorateTimeline(makeBlock('timeline', rows));
      wc = await renderBlock('timeline');
    });

    it('creates qsr-timeline web component', () => { expect(wc.tagName).toBe('qsr-timeline'); });
    it('items count matches mock data', () => {
      expect(JSON.parse(wc.getAttribute('items'))).toHaveLength(mockData.items.length);
    });
    it('first item date matches mock data', () => {
      expect(JSON.parse(wc.getAttribute('items'))[0].date).toBe(mockData.items[0].date);
    });
  });

  /* ── toast ──────────────────────────────────────────────────────── */
  describe('toast block', () => {
    const mockItem = mockBlocksSZ.toast.items[0]; // success
    let wc;

    beforeAll(async () => {
      decorateToast(makeBlock('toast', [
        makeRow(makeCol(mockItem.message)),
        makeRow(makeCol(mockItem.variant)),
      ]));
      wc = await renderBlock('toast');
    });

    it('creates qsr-toast web component', () => { expect(wc.tagName).toBe('qsr-toast'); });
    it('message matches mock data', () => { expect(wc.getAttribute('message')).toBe(mockItem.message); });
    it('variant matches mock data', () => { expect(wc.getAttribute('variant')).toBe(mockItem.variant); });
    it('position defaults to "bottom"', () => { expect(wc.getAttribute('position')).toBe('bottom'); });
  });

  /* ── toggle-switch ──────────────────────────────────────────────── */
  describe('toggle-switch block', () => {
    const mockItem = mockBlocksSZ['toggle-switch'].items[0];
    let wc;

    beforeAll(async () => {
      decorateToggleSwitch(makeBlock('toggle-switch', [makeRow(makeCol(mockItem.label))]));
      wc = await renderBlock('toggle-switch');
    });

    it('creates qsr-toggle-switch web component', () => { expect(wc.tagName).toBe('qsr-toggle-switch'); });
    it('label matches mock data', () => { expect(wc.getAttribute('label')).toBe(mockItem.label); });
    it('checked defaults to "false"', () => { expect(wc.getAttribute('checked')).toBe('false'); });
  });

  /* ── tooltip ────────────────────────────────────────────────────── */
  describe('tooltip block', () => {
    const mockItem = mockBlocksSZ.tooltip.items[0];
    let wc;

    beforeAll(async () => {
      decorateTooltip(makeBlock('tooltip', [
        makeRow(makeCol(mockItem.triggerhtml)),
        makeRow(makeCol(mockItem.content)),
      ]));
      wc = await renderBlock('tooltip');
    });

    it('creates qsr-tooltip web component', () => { expect(wc.tagName).toBe('qsr-tooltip'); });
    it('triggerhtml matches mock data', () => {
      expect(wc.getAttribute('triggerhtml')).toBe(mockItem.triggerhtml);
    });
    it('content matches mock data', () => { expect(wc.getAttribute('content')).toBe(mockItem.content); });
    it('placement matches mock data', () => { expect(wc.getAttribute('placement')).toBe(mockItem.placement); });
  });

  /* ── user-profile (Object.assign) ───────────────────────────────── */
  describe('user-profile block', () => {
    const mockData = mockBlocksSZ['user-profile'];
    let wc;

    beforeAll(async () => {
      await decorateUserProfile(makeBlock('user-profile', []));
      wc = await renderBlock('user-profile');
    });

    it('creates qsr-user-profile web component', () => { expect(wc.tagName).toBe('qsr-user-profile'); });
    it('market defaults to "us"', () => { expect(wc.market).toBe('us'); });
  });

  /* ── video ──────────────────────────────────────────────────────── */
  describe('video block', () => {
    const mockItem = mockBlocksSZ.video.items[0]; // youtube
    let wc;

    beforeAll(async () => {
      const link = el('a', { attrs: { href: mockItem.src } });
      const row = new MockElement('div');
      row.appendChild(link);
      decorateVideo(makeBlock('video', [row]));
      wc = await renderBlock('video');
    });

    it('creates qsr-video web component', () => { expect(wc.tagName).toBe('qsr-video'); });
    it('src matches mock data', () => { expect(wc.getAttribute('src')).toBe(mockItem.src); });
    it('videotype is detected as youtube', () => { expect(wc.getAttribute('videotype')).toBe('youtube'); });
    it('autoplay defaults to "false"', () => { expect(wc.getAttribute('autoplay')).toBe('false'); });
  });

  /* ── mock data completeness ─────────────────────────────────────── */
  describe('mock data completeness', () => {
    it('blocks-a-d.json covers all expected blocks', () => {
      ['accordion', 'alert', 'avatar', 'badge', 'banner', 'breadcrumbs',
        'button', 'button-group', 'calendar', 'cards', 'carousel',
        'checkbox', 'columns', 'date-picker', 'divider'].forEach((name) => {
        expect(mockBlocksAD).toHaveProperty(name);
      });
    });

    it('blocks-d-l.json covers all expected blocks', () => {
      ['drawer', 'dropdown-menu', 'embed', 'file-upload', 'footer',
        'form', 'fragment', 'header', 'hero', 'icon', 'image',
        'input-field', 'link', 'list'].forEach((name) => {
        expect(mockBlocksDL).toHaveProperty(name);
      });
    });

    it('blocks-m-r.json covers all expected blocks', () => {
      ['menu-item', 'modal', 'pagination', 'popover', 'pricing-table',
        'product-detail', 'progress-bar', 'promotion-banner', 'quote',
        'radio-button', 'rating-stars', 'rewards-feed'].forEach((name) => {
        expect(mockBlocksMR).toHaveProperty(name);
      });
    });

    it('blocks-s-z.json covers all expected blocks', () => {
      ['search', 'select-dropdown', 'sidebar', 'skeleton-loader', 'slider',
        'spinner', 'stepper', 'store-locator', 'table', 'tabs', 'tag',
        'testimonials', 'textarea', 'timeline', 'toast', 'toggle-switch',
        'tooltip', 'user-profile', 'video'].forEach((name) => {
        expect(mockBlocksSZ).toHaveProperty(name);
      });
    });

    it('accordion mock data has required shape', () => {
      expect(Array.isArray(mockBlocksAD.accordion.items)).toBe(true);
      mockBlocksAD.accordion.items.forEach((item) => {
        expect(item).toHaveProperty('label');
        expect(item).toHaveProperty('body');
      });
    });

    it('cards mock data items have imageUrl, imageAlt, title, bodyHtml', () => {
      mockBlocksAD.cards.items.forEach((item) => {
        expect(item).toHaveProperty('imageUrl');
        expect(item).toHaveProperty('imageAlt');
        expect(item).toHaveProperty('title');
        expect(item).toHaveProperty('bodyHtml');
      });
    });

    it('carousel mock data slides have imageUrl, imageAlt, contentHtml', () => {
      mockBlocksAD.carousel.slides.forEach((slide) => {
        expect(slide).toHaveProperty('imageUrl');
        expect(slide).toHaveProperty('imageAlt');
        expect(slide).toHaveProperty('contentHtml');
      });
    });

    it('tabs mock data items have label and contentHtml', () => {
      mockBlocksSZ.tabs.items.forEach((item) => {
        expect(item).toHaveProperty('label');
        expect(item).toHaveProperty('contentHtml');
      });
    });

    it('hero mock data items have imageUrl, imageAlt, contentHtml', () => {
      mockBlocksDL.hero.items.forEach((item) => {
        expect(item).toHaveProperty('imageUrl');
        expect(item).toHaveProperty('imageAlt');
        expect(item).toHaveProperty('contentHtml');
      });
    });

    it('user-profile mock data has user with name and starsBalance', () => {
      const { user } = mockBlocksSZ['user-profile'];
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('starsBalance');
      expect(typeof user.starsBalance).toBe('number');
    });

    it('store-locator mock data stores have id, name, address', () => {
      mockBlocksSZ['store-locator'].stores.forEach((store) => {
        expect(store).toHaveProperty('id');
        expect(store).toHaveProperty('name');
        expect(store).toHaveProperty('address');
      });
    });

    it('product-detail mock data items have correct price format', () => {
      mockBlocksMR['product-detail'].items.forEach((item) => {
        expect(item.price).toMatch(/^\$[\d.]+$/);
      });
    });

    it('rewards-feed mock data has earn and redeem entries', () => {
      const types = new Set(mockBlocksMR['rewards-feed'].items.map((i) => i.type));
      expect(types.has('earn')).toBe(true);
      expect(types.has('redeem')).toBe(true);
    });
  });
});
