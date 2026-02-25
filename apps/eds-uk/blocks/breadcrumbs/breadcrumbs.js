import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'breadcrumbs',
    label: 'Breadcrumbs',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const items = rows.map((row, i) => {
    const cell = row.querySelector('div') || row;
    annotateField(cell, { prop: `item-${i}`, type: 'text', label: `Breadcrumb Item ${i + 1}` });
    const link = cell.querySelector('a');
    return link
      ? { title: link.textContent.trim(), path: link.href }
      : { title: cell.textContent.trim() };
  });

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    await import('/blocks/breadcrumbs/qsr-breadcrumbs.js');
    const wc = document.createElement('qsr-breadcrumbs');
    wc.setAttribute('items', JSON.stringify(items));
    block.replaceWith(wc);
  }, { rootMargin: '200px' });
  observer.observe(block);
}
