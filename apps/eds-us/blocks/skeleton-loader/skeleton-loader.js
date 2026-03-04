import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'skeleton-loader',
    label: 'Skeleton Loader',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const typeCol = rows[0]?.children[0] || rows[0];
  const countCol = rows[1]?.children[0] || rows[1];

  if (typeCol) annotateField(typeCol, { prop: 'type', type: 'text', label: 'Skeleton Type' });
  if (countCol) annotateField(countCol, { prop: 'count', type: 'text', label: 'Line Count' });

  const skeletontype = typeCol?.textContent.trim() || 'text';
  const count = countCol?.textContent.trim() || '3';

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    await import('/blocks/skeleton-loader/qsr-skeleton-loader.js');
    const wc = document.createElement('qsr-skeleton-loader');
    wc.setAttribute('skeletontype', skeletontype);
    wc.setAttribute('count', count);
    block.replaceWith(wc);
  }, { rootMargin: '200px' });
  observer.observe(block);
}
