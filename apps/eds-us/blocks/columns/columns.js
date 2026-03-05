import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';
import { withLazyLoading } from '../../scripts/a11y.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'columns',
    label: 'Columns',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const columndata = rows.flatMap((row) => {
    return [...row.children].map((col, i) => {
      annotateField(col, { prop: `col-${i}`, type: 'richtext', label: `Column ${i + 1}` });
      const img = col.querySelector('img');
      const picture = col.querySelector('picture');
      const isImage = !!(img || picture) && col.children.length === 1;
      return {
        isImage,
        imageUrl: img?.src || '',
        imageAlt: img?.alt || '',
        contentHtml: col.innerHTML,
      };
    });
  });

  withLazyLoading(block, {
    loadComponent: async () => {
      await import('/blocks/columns/qsr-columns.js');
      const wc = document.createElement('qsr-columns');
      wc.setAttribute('columndata', JSON.stringify(columndata));
      wc.setAttribute('devicetype', document.documentElement.dataset.device || 'desktop');
      return wc;
    },
  });
}
