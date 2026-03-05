/**
 * SEO Utility Module
 *
 * Provides page-level SEO enhancements including:
 * - Meta tags (description, keywords, canonical URL)
 * - Open Graph (OG) tags for social sharing
 * - Twitter Card tags
 * - JSON-LD structured data
 * - Robots meta directives
 *
 * Usage:
 *   import { initSEO } from './seo.js';
 *   initSEO();
 */

import { getMetadata } from './aem.js';

/* ─── Helpers ──────────────────────────────────────────────────────────── */

/**
 * Sets or creates a <meta> tag in <head>.
 * @param {string} attr  - Attribute name ('name' or 'property')
 * @param {string} key   - Attribute value (e.g. 'description', 'og:title')
 * @param {string} value - Content value
 */
function setMetaTag(attr, key, value) {
  if (!value) return;
  let tag = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, key);
    document.head.append(tag);
  }
  tag.setAttribute('content', value);
}

/**
 * Sets or creates a <link> tag in <head>.
 * @param {string} rel  - Relationship (e.g. 'canonical')
 * @param {string} href - URL
 */
function setLinkTag(rel, href) {
  if (!href) return;
  let link = document.head.querySelector(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    document.head.append(link);
  }
  link.setAttribute('href', href);
}

/* ─── Page Metadata ────────────────────────────────────────────────────── */

/**
 * Sets core page meta tags from AEM metadata.
 */
function setPageMetadata() {
  const title = getMetadata('og:title') || document.title;
  const description = getMetadata('description')
    || getMetadata('og:description')
    || '';
  const keywords = getMetadata('keywords') || '';
  const robots = getMetadata('robots') || 'index, follow';
  const author = getMetadata('author') || '';

  if (title) document.title = title;
  setMetaTag('name', 'description', description);
  setMetaTag('name', 'keywords', keywords);
  setMetaTag('name', 'robots', robots);
  if (author) setMetaTag('name', 'author', author);
}

/* ─── Canonical URL ────────────────────────────────────────────────────── */

/**
 * Sets the canonical URL for the page.
 */
function setCanonicalUrl() {
  const canonical = getMetadata('canonical')
    || `${window.location.origin}${window.location.pathname}`;
  setLinkTag('canonical', canonical);
}

/* ─── Open Graph Tags ──────────────────────────────────────────────────── */

/**
 * Sets Open Graph meta tags for social sharing.
 */
function setOpenGraphTags() {
  const title = getMetadata('og:title') || document.title;
  const description = getMetadata('og:description') || getMetadata('description') || '';
  const image = getMetadata('og:image') || '';
  const url = getMetadata('og:url') || `${window.location.origin}${window.location.pathname}`;
  const type = getMetadata('og:type') || 'website';
  const siteName = getMetadata('og:site_name') || '';
  const locale = getMetadata('og:locale') || document.documentElement.lang || 'en_US';

  setMetaTag('property', 'og:title', title);
  setMetaTag('property', 'og:description', description);
  setMetaTag('property', 'og:url', url);
  setMetaTag('property', 'og:type', type);
  if (image) setMetaTag('property', 'og:image', image);
  if (siteName) setMetaTag('property', 'og:site_name', siteName);
  setMetaTag('property', 'og:locale', locale);
}

/* ─── Twitter Card Tags ────────────────────────────────────────────────── */

/**
 * Sets Twitter Card meta tags.
 */
function setTwitterCardTags() {
  const card = getMetadata('twitter:card') || 'summary_large_image';
  const title = getMetadata('twitter:title') || getMetadata('og:title') || document.title;
  const description = getMetadata('twitter:description')
    || getMetadata('og:description')
    || getMetadata('description')
    || '';
  const image = getMetadata('twitter:image') || getMetadata('og:image') || '';
  const site = getMetadata('twitter:site') || '';
  const creator = getMetadata('twitter:creator') || '';

  setMetaTag('name', 'twitter:card', card);
  setMetaTag('name', 'twitter:title', title);
  setMetaTag('name', 'twitter:description', description);
  if (image) setMetaTag('name', 'twitter:image', image);
  if (site) setMetaTag('name', 'twitter:site', site);
  if (creator) setMetaTag('name', 'twitter:creator', creator);
}

/* ─── JSON-LD Structured Data ──────────────────────────────────────────── */

/**
 * Injects a JSON-LD script tag for structured data.
 * @param {object} data - JSON-LD structured data object
 */
export function addJsonLd(data) {
  if (!data) return;
  const script = document.createElement('script');
  script.setAttribute('type', 'application/ld+json');
  script.textContent = JSON.stringify(data);
  document.head.append(script);
}

/**
 * Builds and injects default Organization + WebSite structured data.
 */
function setDefaultStructuredData() {
  const siteName = getMetadata('og:site_name') || document.title;
  const siteUrl = window.location.origin;
  const logo = getMetadata('og:image') || '';

  const orgData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: siteUrl,
  };
  if (logo) orgData.logo = logo;
  addJsonLd(orgData);

  addJsonLd({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: siteUrl,
  });
}

/**
 * Builds BreadcrumbList structured data from breadcrumb items on the page.
 */
function setBreadcrumbStructuredData() {
  const breadcrumbEl = document.querySelector('.breadcrumbs, qsr-breadcrumbs, nav[aria-label="Breadcrumb"]');
  if (!breadcrumbEl) return;

  const links = breadcrumbEl.querySelectorAll('a');
  if (!links.length) return;

  const items = [...links].map((link, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: link.textContent.trim(),
    item: link.href,
  }));

  addJsonLd({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  });
}

/* ─── Language / Locale ────────────────────────────────────────────────── */

/**
 * Ensures the document has a lang attribute.
 */
function setLanguageAttribute() {
  if (!document.documentElement.lang) {
    const lang = getMetadata('lang') || getMetadata('locale') || 'en';
    document.documentElement.setAttribute('lang', lang);
  }
}

/* ─── Public API ───────────────────────────────────────────────────────── */

/**
 * Initializes all page-level SEO enhancements.
 * Call after the page DOM is ready.
 */
export function initSEO() {
  setLanguageAttribute();
  setPageMetadata();
  setCanonicalUrl();
  setOpenGraphTags();
  setTwitterCardTags();
  setDefaultStructuredData();

  // Breadcrumb structured data may be set after blocks load
  if (document.readyState === 'complete') {
    setBreadcrumbStructuredData();
  } else {
    window.addEventListener('load', () => setBreadcrumbStructuredData());
  }
}
