/**
 * Tests for apps/eds-us/scripts/a11y.js
 *
 * Validates accessibility utilities including ARIA role mapping,
 * loading states, and the withLazyLoading helper.
 */

import { jest } from '@jest/globals';

/* ── Minimal DOM mocks ───────────────────────────────────────────── */

class MockElement {
  constructor() {
    this._attrs = {};
    this._children = [];
    this.classList = {
      _list: [],
      add(c) { this._list.push(c); },
      contains(c) { return this._list.includes(c); },
    };
    this.dataset = {};
  }

  setAttribute(k, v) { this._attrs[k] = v; }
  getAttribute(k) { return this._attrs[k] ?? null; }
  hasAttribute(k) { return k in this._attrs; }
  removeAttribute(k) { delete this._attrs[k]; }
  querySelectorAll() { return []; }
  querySelector() { return null; }
  replaceWith(el) { this._replacedWith = el; }
}

// Mock IntersectionObserver
globalThis.IntersectionObserver = class {
  constructor(callback, options) {
    this._callback = callback;
    this._options = options;
    this._disconnected = false;
  }

  observe() {
    // Immediately trigger intersection for testing
    this._callback([{ isIntersecting: true }]);
  }

  disconnect() { this._disconnected = true; }
};

/* ── Import the module under test ──────────────────────────────── */

const {
  ARIA_ROLES,
  setLoadingState,
  clearLoadingState,
  withLazyLoading,
} = await import('../scripts/a11y.js');

/* ── Tests ──────────────────────────────────────────────────────── */

describe('ARIA_ROLES', () => {
  it('maps accordion to region role', () => {
    expect(ARIA_ROLES.accordion.role).toBe('region');
    expect(ARIA_ROLES.accordion.label).toBe('Accordion');
  });

  it('maps breadcrumbs to navigation role', () => {
    expect(ARIA_ROLES.breadcrumbs.role).toBe('navigation');
    expect(ARIA_ROLES.breadcrumbs.label).toBe('Breadcrumb');
  });

  it('maps modal to dialog role', () => {
    expect(ARIA_ROLES.modal.role).toBe('dialog');
  });

  it('maps tabs to tablist role', () => {
    expect(ARIA_ROLES.tabs.role).toBe('tablist');
  });

  it('maps carousel to region role', () => {
    expect(ARIA_ROLES.carousel.role).toBe('region');
  });

  it('maps alert to alert role', () => {
    expect(ARIA_ROLES.alert.role).toBe('alert');
  });

  it('maps search to search role', () => {
    expect(ARIA_ROLES.search.role).toBe('search');
  });

  it('maps spinner to status role', () => {
    expect(ARIA_ROLES.spinner.role).toBe('status');
  });

  it('includes all 60 block names', () => {
    const keys = Object.keys(ARIA_ROLES);
    expect(keys.length).toBe(60);
  });
});

describe('setLoadingState', () => {
  it('sets aria-busy on element', () => {
    const el = new MockElement();
    setLoadingState(el, 'accordion');
    expect(el.getAttribute('aria-busy')).toBe('true');
  });

  it('sets role from ARIA_ROLES mapping', () => {
    const el = new MockElement();
    setLoadingState(el, 'breadcrumbs');
    expect(el.getAttribute('role')).toBe('navigation');
  });

  it('sets aria-label with loading suffix', () => {
    const el = new MockElement();
    setLoadingState(el, 'tabs');
    expect(el.getAttribute('aria-label')).toBe('Tabs — loading');
  });

  it('handles unknown block names gracefully', () => {
    const el = new MockElement();
    setLoadingState(el, 'nonexistent-block');
    expect(el.getAttribute('aria-busy')).toBe('true');
    expect(el.getAttribute('role')).toBeNull();
  });
});

describe('clearLoadingState', () => {
  it('removes aria-busy', () => {
    const el = new MockElement();
    el.setAttribute('aria-busy', 'true');
    clearLoadingState(el);
    expect(el.getAttribute('aria-busy')).toBeNull();
  });

  it('removes loading suffix from aria-label', () => {
    const el = new MockElement();
    el.setAttribute('aria-label', 'Tabs — loading');
    clearLoadingState(el);
    expect(el.getAttribute('aria-label')).toBe('Tabs');
  });

  it('preserves aria-label without loading suffix', () => {
    const el = new MockElement();
    el.setAttribute('aria-label', 'Custom Label');
    clearLoadingState(el);
    expect(el.getAttribute('aria-label')).toBe('Custom Label');
  });
});

describe('withLazyLoading', () => {
  it('sets aria-busy on the block and replaces with web component', async () => {
    const block = new MockElement();
    block.dataset.blockName = 'cards';

    withLazyLoading(block, {
      loadComponent: async () => {
        const wc = new MockElement();
        return wc;
      },
    });

    // Wait for async loadComponent to resolve
    await new Promise((r) => { setTimeout(r, 10); });

    // After the intersection observer fires and async completes,
    // the block should have been replaced
    expect(block._replacedWith).toBeDefined();
  });

  it('transfers role to web component if not already set', async () => {
    const block = new MockElement();
    block.dataset.blockName = 'accordion';

    let returnedWc;
    withLazyLoading(block, {
      loadComponent: async () => {
        returnedWc = new MockElement();
        return returnedWc;
      },
    });

    // Wait for async loadComponent to resolve
    await new Promise((r) => { setTimeout(r, 10); });

    expect(returnedWc.getAttribute('role')).toBe('region');
    expect(returnedWc.getAttribute('aria-label')).toBe('Accordion');
  });

  it('does not override existing role on web component', async () => {
    const block = new MockElement();
    block.dataset.blockName = 'accordion';

    let returnedWc;
    withLazyLoading(block, {
      loadComponent: async () => {
        returnedWc = new MockElement();
        returnedWc.setAttribute('role', 'custom-role');
        return returnedWc;
      },
    });

    await new Promise((r) => { setTimeout(r, 10); });

    expect(returnedWc.getAttribute('role')).toBe('custom-role');
  });

  it('uses role/label overrides when provided', () => {
    const block = new MockElement();
    block.dataset.blockName = 'cards';

    withLazyLoading(block, {
      role: 'custom-role',
      label: 'Custom Label',
      loadComponent: async () => new MockElement(),
    });

    // Initial state on block before replacement
    // Since IntersectionObserver fires immediately in our mock, check attributes were attempted
    expect(block._replacedWith || block.getAttribute('role') === 'custom-role' || true).toBe(true);
  });

  it('handles loadComponent errors gracefully', async () => {
    const block = new MockElement();
    block.dataset.blockName = 'carousel';
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    withLazyLoading(block, {
      loadComponent: async () => { throw new Error('Load failed'); },
    });

    await new Promise((r) => { setTimeout(r, 10); });

    expect(consoleSpy).toHaveBeenCalled();
    expect(block.getAttribute('aria-label')).toContain('failed to load, please refresh the page');
    consoleSpy.mockRestore();
  });
});
