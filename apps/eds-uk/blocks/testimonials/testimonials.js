import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';
import { withLazyLoading } from '../../scripts/a11y.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'testimonials',
    label: 'Testimonials',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const items = rows.map((row, i) => {
    const quoteCol = row.children[0];
    const authorCol = row.children[1];
    const imgCol = row.querySelector('img');
    if (quoteCol) annotateField(quoteCol, { prop: `testimonial-quote-${i}`, type: 'richtext', label: `Testimonial ${i + 1} Quote` });
    if (authorCol) annotateField(authorCol, { prop: `testimonial-author-${i}`, type: 'text', label: `Testimonial ${i + 1} Author` });
    return {
      quoteHtml: quoteCol?.innerHTML || '',
      author: authorCol?.textContent.trim() || '',
      imageurl: imgCol?.src || '',
      imagealt: imgCol?.alt || '',
    };
  });

  withLazyLoading(block, {
    loadComponent: async () => {
      await import('/blocks/testimonials/qsr-testimonials.js');
      const wc = document.createElement('qsr-testimonials');
      wc.setAttribute('items', JSON.stringify(items));
      return wc;
    },
  });
}
