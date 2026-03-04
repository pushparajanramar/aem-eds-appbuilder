import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

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

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    await import('/blocks/timeline/qsr-timeline.js');
    const wc = document.createElement('qsr-timeline');
    wc.setAttribute('items', JSON.stringify(items));
    block.replaceWith(wc);
  }, { rootMargin: '200px' });
  observer.observe(block);
}
