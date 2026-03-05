/**
 * Accessibility (WCAG 2.1 AA) Utility Module
 *
 * Provides shared helpers for block decorators to ensure consistent
 * accessible loading states, ARIA attributes, and screen-reader support
 * during the transition from static content to web components.
 *
 * Usage:
 *   import { withLazyLoading, ARIA_ROLES } from '../../scripts/a11y.js';
 *
 *   export default function decorate(block) {
 *     // ... extract data ...
 *     withLazyLoading(block, {
 *       role: 'region',
 *       label: 'Accordion',
 *       loadComponent: async () => {
 *         await import('/blocks/accordion/qsr-accordion.js');
 *         const wc = document.createElement('qsr-accordion');
 *         wc.setAttribute('items', JSON.stringify(items));
 *         return wc;
 *       },
 *     });
 *   }
 */

/* ─── ARIA Role Mapping ────────────────────────────────────────────────── */

/**
 * Maps block names to appropriate ARIA roles and labels.
 * Only includes blocks that require explicit roles beyond their
 * default semantic meaning.
 */
export const ARIA_ROLES = {
  accordion: { role: 'region', label: 'Accordion' },
  alert: { role: 'alert', label: 'Alert' },
  avatar: { role: 'img', label: 'User avatar' },
  badge: { role: 'status', label: 'Badge' },
  banner: { role: 'banner', label: 'Banner' },
  breadcrumbs: { role: 'navigation', label: 'Breadcrumb' },
  button: { role: 'button', label: 'Button' },
  'button-group': { role: 'group', label: 'Button group' },
  calendar: { role: 'application', label: 'Calendar' },
  cards: { role: 'list', label: 'Cards' },
  carousel: { role: 'region', label: 'Carousel' },
  checkbox: { role: 'group', label: 'Checkbox group' },
  columns: { role: 'presentation', label: null },
  'date-picker': { role: 'group', label: 'Date picker' },
  divider: { role: 'separator', label: null },
  drawer: { role: 'complementary', label: 'Drawer' },
  'dropdown-menu': { role: 'menu', label: 'Menu' },
  embed: { role: 'region', label: 'Embedded content' },
  'file-upload': { role: 'group', label: 'File upload' },
  footer: { role: 'contentinfo', label: 'Footer' },
  form: { role: 'form', label: 'Form' },
  fragment: { role: 'region', label: 'Content fragment' },
  header: { role: 'banner', label: 'Header' },
  hero: { role: 'banner', label: 'Hero' },
  icon: { role: 'img', label: 'Icon' },
  image: { role: 'img', label: 'Image' },
  'input-field': { role: 'group', label: 'Input field' },
  link: { role: 'link', label: null },
  list: { role: 'list', label: 'List' },
  'menu-item': { role: 'article', label: 'Menu item' },
  modal: { role: 'dialog', label: 'Dialog' },
  pagination: { role: 'navigation', label: 'Pagination' },
  popover: { role: 'dialog', label: 'Popover' },
  'pricing-table': { role: 'table', label: 'Pricing table' },
  'product-detail': { role: 'article', label: 'Product detail' },
  'progress-bar': { role: 'progressbar', label: 'Progress' },
  'promotion-banner': { role: 'banner', label: 'Promotion' },
  quote: { role: 'blockquote', label: 'Quote' },
  'radio-button': { role: 'radiogroup', label: 'Radio button group' },
  'rating-stars': { role: 'img', label: 'Rating' },
  'rewards-feed': { role: 'feed', label: 'Rewards feed' },
  search: { role: 'search', label: 'Search' },
  'select-dropdown': { role: 'listbox', label: 'Select' },
  sidebar: { role: 'navigation', label: 'Sidebar' },
  'skeleton-loader': { role: 'status', label: 'Loading content' },
  slider: { role: 'slider', label: 'Slider' },
  spinner: { role: 'status', label: 'Loading' },
  stepper: { role: 'navigation', label: 'Steps' },
  'store-locator': { role: 'search', label: 'Store locator' },
  table: { role: 'table', label: 'Table' },
  tabs: { role: 'tablist', label: 'Tabs' },
  tag: { role: 'status', label: 'Tag' },
  testimonials: { role: 'region', label: 'Testimonials' },
  textarea: { role: 'group', label: 'Text area' },
  timeline: { role: 'list', label: 'Timeline' },
  toast: { role: 'alert', label: 'Notification' },
  'toggle-switch': { role: 'switch', label: 'Toggle' },
  tooltip: { role: 'tooltip', label: 'Tooltip' },
  'user-profile': { role: 'region', label: 'User profile' },
  video: { role: 'region', label: 'Video' },
};

/* ─── Loading State ────────────────────────────────────────────────────── */

/**
 * Sets ARIA loading state attributes on a block element.
 * @param {HTMLElement} block - The block element
 * @param {string} blockName  - Block name for role lookup
 */
export function setLoadingState(block, blockName) {
  block.setAttribute('aria-busy', 'true');
  const mapping = ARIA_ROLES[blockName];
  if (mapping) {
    if (mapping.role) block.setAttribute('role', mapping.role);
    if (mapping.label) block.setAttribute('aria-label', `${mapping.label} — loading`);
  }
}

/**
 * Clears ARIA loading state from a block element.
 * @param {HTMLElement} block - The block element
 */
export function clearLoadingState(block) {
  block.removeAttribute('aria-busy');
  const label = block.getAttribute('aria-label');
  if (label && label.endsWith(' — loading')) {
    block.setAttribute('aria-label', label.replace(' — loading', ''));
  }
}

/* ─── Lazy-Loading Wrapper ─────────────────────────────────────────────── */

/**
 * Wraps the common IntersectionObserver lazy-loading pattern with
 * accessible loading states. Sets aria-busy during load and ensures
 * smooth handoff to web components.
 *
 * @param {HTMLElement} block - The block element to observe
 * @param {object} opts
 * @param {Function} opts.loadComponent - Async function that returns the web component element
 * @param {string}   [opts.role]        - ARIA role override
 * @param {string}   [opts.label]       - ARIA label override
 * @param {string}   [opts.rootMargin]  - IntersectionObserver rootMargin (default: '200px')
 */
export function withLazyLoading(block, { loadComponent, role, label, rootMargin = '200px' }) {
  const blockName = block.dataset.blockName || block.classList[0] || '';
  const mapping = ARIA_ROLES[blockName] || {};

  // Apply initial ARIA attributes
  const effectiveRole = role || mapping.role;
  const effectiveLabel = label || mapping.label;
  if (effectiveRole) block.setAttribute('role', effectiveRole);
  if (effectiveLabel) block.setAttribute('aria-label', effectiveLabel);
  block.setAttribute('aria-busy', 'true');

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();

    try {
      const wc = await loadComponent();
      if (wc) {
        // Transfer ARIA attributes to the web component if needed
        if (effectiveRole && !wc.hasAttribute('role')) {
          wc.setAttribute('role', effectiveRole);
        }
        if (effectiveLabel && !wc.hasAttribute('aria-label')) {
          wc.setAttribute('aria-label', effectiveLabel);
        }
        block.replaceWith(wc);
      }
    } catch (err) {
      // On error, mark the block as no longer loading and show error state
      block.removeAttribute('aria-busy');
      block.setAttribute('aria-label', `${effectiveLabel || blockName} — failed to load`);
      // eslint-disable-next-line no-console
      console.error(`Failed to load component: ${blockName}`, err);
    }
  }, { rootMargin });

  observer.observe(block);
}
