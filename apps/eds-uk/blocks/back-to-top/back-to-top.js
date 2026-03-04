import { annotateBlock, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'back-to-top',
    label: 'Back to Top',
  });

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    await import('/blocks/back-to-top/qsr-back-to-top.js');
    const wc = document.createElement('qsr-back-to-top');
    block.replaceWith(wc);
  }, { rootMargin: '200px' });
  observer.observe(block);
}
