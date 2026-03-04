import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'banner',
    label: 'Banner',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const contentCol = rows[0]?.children[0] || rows[0];
  const ctaCol = rows[1]?.children[0] || rows[1];

  if (contentCol) annotateField(contentCol, { prop: 'content', type: 'richtext', label: 'Banner Content' });
  if (ctaCol) annotateField(ctaCol, { prop: 'cta', type: 'richtext', label: 'Banner CTA' });

  const contentHtml = contentCol?.innerHTML || '';
  const ctaHtml = ctaCol?.innerHTML || '';
  const variant = block.classList.contains('info') ? 'info'
    : block.classList.contains('warning') ? 'warning'
      : block.classList.contains('error') ? 'error' : 'default';

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    await import('/blocks/banner/qsr-banner.js');
    const wc = document.createElement('qsr-banner');
    wc.setAttribute('contenthtml', contentHtml);
    wc.setAttribute('ctahtml', ctaHtml);
    wc.setAttribute('variant', variant);
    block.replaceWith(wc);
  }, { rootMargin: '200px' });
  observer.observe(block);
}
