import { annotateBlock, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'search',
    label: 'Search',
  });

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    await import('/blocks/search/qsr-search.js');
    const wc = document.createElement('qsr-search');
    block.replaceWith(wc);
  }, { rootMargin: '200px' });
  observer.observe(block);
}
