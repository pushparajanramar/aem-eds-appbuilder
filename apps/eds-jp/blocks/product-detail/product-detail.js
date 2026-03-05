/**
 * Product Detail Block
 *
 * Lazy-loads the qsr-product-customizer Web Component via withLazyLoading.
 * Follows RULE 1 (Vanilla JS only) and RULE 2 (UE annotations required).
 */

import { readBlockConfig } from '../../scripts/aem.js';
import { withLazyLoading } from '../../scripts/a11y.js';
import { annotateBlock, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default async function decorate(block) {
  const config = readBlockConfig(block);
  const cfPath = getCFPath(block);

  // RULE 2: annotate block container before lazy-loading
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'product-detail',
    label: 'Product Detail',
  });

  const productId = config['product-id'] || block.querySelector('a')?.textContent?.trim();
  const market = config.market || document.documentElement.lang?.substring(0, 2) || 'us';

  // RULE 1: lazy-load Web Component via withLazyLoading
  withLazyLoading(block, {
    loadComponent: async () => {
      await import('/blocks/product-detail/qsr-product-customizer.js');
      const wc = Object.assign(document.createElement('qsr-product-customizer'), {
        productid: productId,
        market,
      });
      return wc;
    },
  });
}
