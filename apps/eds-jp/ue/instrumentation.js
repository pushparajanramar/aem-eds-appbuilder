/**
 * Universal Editor Instrumentation Helpers
 *
 * Provides annotateBlock, annotateField, and getCFPath utilities for adding
 * AEM Universal Editor data attributes to editable elements.
 *
 * Usage:
 *   import { annotateBlock, annotateField, getCFPath } from '../../ue/instrumentation.js';
 */

/**
 * Extracts the Content Fragment path from the first <a> in the block.
 * Falls back to the current page path for DA/SharePoint-backed pages.
 *
 * @param {HTMLElement} block
 * @returns {string} CF path, e.g. "/content/dam/qsr/products/grande-latte"
 */
export function getCFPath(block) {
  const anchor = block.querySelector('a[href]');
  if (anchor) {
    try {
      const url = new URL(anchor.href, window.location.href);
      return url.pathname;
    } catch {
      return anchor.getAttribute('href') || window.location.pathname;
    }
  }
  return window.location.pathname;
}

/**
 * Annotates a block container with Universal Editor data attributes.
 *
 * @param {HTMLElement} el  - The block root element
 * @param {object} opts
 * @param {string} opts.resource - Full URN, e.g. "urn:aemconnection:/content/dam/..."
 * @param {string} [opts.type]   - Component type (default: "component")
 * @param {string} [opts.model]  - Model id matching component-models.json
 * @param {string} [opts.label]  - Human-readable label shown in UE sidebar
 */
export function annotateBlock(el, { resource, type = 'component', model, label }) {
  if (!el) return;
  el.setAttribute('data-aue-resource', resource);
  el.setAttribute('data-aue-type', type);
  if (model) el.setAttribute('data-aue-model', model);
  if (label) el.setAttribute('data-aue-label', label);
}

/**
 * Annotates an individual editable field inside a block.
 *
 * @param {HTMLElement|null} el - The DOM element for the field
 * @param {object} opts
 * @param {string} opts.prop    - Property name matching the model field definition
 * @param {string} opts.type    - Field type: "text" | "richtext" | "media" | "reference" | "boolean"
 * @param {string} [opts.label] - Human-readable label shown in UE property panel
 */
export function annotateField(el, { prop, type, label }) {
  if (!el) return;
  el.setAttribute('data-aue-prop', prop);
  el.setAttribute('data-aue-type', type);
  if (label) el.setAttribute('data-aue-label', label);
}

/**
 * Builds an AEM Connection URN from a CF path.
 *
 * @param {string} cfPath - Absolute CF path, e.g. "/content/dam/qsr/..."
 * @returns {string}
 */
export function buildAEMUrn(cfPath) {
  return `urn:aemconnection:${cfPath}`;
}

/**
 * Builds a SharePoint URN from a page path (for DA-backed pages).
 *
 * @param {string} [pagePath] - Defaults to window.location.pathname
 * @returns {string}
 */
export function buildSharePointUrn(pagePath = window.location.pathname) {
  return `urn:sharepoint:${pagePath}`;
}
