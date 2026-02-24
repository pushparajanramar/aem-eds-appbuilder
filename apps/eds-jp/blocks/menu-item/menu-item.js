/**
 * Menu Item Block
 *
 * Lazy-loads the sbux-menu-card Web Component via IntersectionObserver.
 * Follows RULE 1 (Vanilla JS only) and RULE 2 (UE annotations required).
 */

import { readBlockConfig } from '../../scripts/aem.js';
import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default async function decorate(block) {
  const config = readBlockConfig(block);
  const cfPath = getCFPath(block);

  // RULE 2: annotate block container
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'menuitem',
    label: 'Menu Item',
  });

  // Annotate individual editable fields
  const title = block.querySelector('h1, h2, h3');
  const description = block.querySelector('p');
  const picture = block.querySelector('picture');
  const priceEl = block.querySelector('.price, [data-price]');

  annotateField(title, { prop: 'title', type: 'text', label: 'Item Name' });
  annotateField(description, { prop: 'description', type: 'richtext', label: 'Description' });
  annotateField(picture, { prop: 'image', type: 'media', label: 'Product Image' });
  if (priceEl) {
    annotateField(priceEl, { prop: 'price', type: 'text', label: 'Price' });
  }

  const itemId = config['item-id'] || cfPath.split('/').pop();
  const market = config.market || document.documentElement.lang?.substring(0, 2) || 'us';
  const category = config.category || 'drinks';

  // RULE 1: lazy-load Web Component via IntersectionObserver
  const observer = new IntersectionObserver(
    async ([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      await import('/blocks/menu-item/sbux-menu-card.js');
      const wc = Object.assign(document.createElement('sbux-menu-card'), {
        itemid: itemId,
        market,
        category,
      });
      block.replaceWith(wc);
    },
    { rootMargin: '200px' },
  );

  observer.observe(block);
}
