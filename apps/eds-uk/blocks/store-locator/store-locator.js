/**
 * Store Locator Block
 *
 * Lazy-loads the sbux-store-locator Web Component via IntersectionObserver.
 * Covers the /bff/locations endpoint: nearby-store search by lat/lng or place.
 * Follows RULE 1 (Vanilla JS only) and RULE 2 (UE annotations required).
 */

import { readBlockConfig } from '../../scripts/aem.js';
import { annotateBlock, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default async function decorate(block) {
  const config = readBlockConfig(block);
  const cfPath = getCFPath(block);

  // RULE 2: annotate block container before lazy-loading
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'store-locator',
    label: 'Store Locator',
  });

  const market = config.market || document.documentElement.lang?.substring(0, 2) || 'us';
  const radius = config.radius || '5';
  const lat = config.lat || '';
  const lng = config.lng || '';
  const place = config.place || '';

  // RULE 1: use IntersectionObserver — never top-level await import
  const observer = new IntersectionObserver(
    async ([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      await import('/blocks/store-locator/sbux-store-locator.js');
      const wc = Object.assign(document.createElement('sbux-store-locator'), {
        market,
        radius,
        lat,
        lng,
        place,
      });
      block.replaceWith(wc);
    },
    { rootMargin: '200px' },
  );

  observer.observe(block);
}
