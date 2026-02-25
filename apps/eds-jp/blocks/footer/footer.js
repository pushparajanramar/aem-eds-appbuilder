import { getMetadata } from '../../scripts/aem.js';
import { annotateBlock, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default async function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'footer',
    label: 'Footer',
  });

  const footerMeta = getMetadata('footer');
  const path = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    await import('/blocks/footer/qsr-footer.js');
    const wc = document.createElement('qsr-footer');
    wc.setAttribute('path', path);
    block.replaceWith(wc);
  }, { rootMargin: '200px' });
  observer.observe(block);
}
