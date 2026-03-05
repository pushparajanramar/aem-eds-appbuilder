import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';
import { withLazyLoading } from '../../scripts/a11y.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'timeline',
    label: 'Timeline',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const items = rows.map((row, i) => {
    const dateCol = row.children[0];
    const contentCol = row.children[1];
    if (dateCol) annotateField(dateCol, { prop: `timeline-date-${i}`, type: 'text', label: `Event ${i + 1} Date` });
    if (contentCol) annotateField(contentCol, { prop: `timeline-content-${i}`, type: 'richtext', label: `Event ${i + 1} Content` });
    return {
      date: dateCol?.textContent.trim() || '',
      contentHtml: contentCol?.innerHTML || '',
    };
  });

  withLazyLoading(block, {
    loadComponent: async () => {
      await import('/blocks/timeline/qsr-timeline.js');
      const wc = document.createElement('qsr-timeline');
      wc.setAttribute('items', JSON.stringify(items));
      return wc;
    },
  });
}
