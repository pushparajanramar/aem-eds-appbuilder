import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';
import { withLazyLoading } from '../../scripts/a11y.js';

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

  withLazyLoading(block, {
    loadComponent: async () => {
      await import('/blocks/banner/qsr-banner.js');
      const wc = document.createElement('qsr-banner');
      wc.setAttribute('contenthtml', contentHtml);
      wc.setAttribute('ctahtml', ctaHtml);
      wc.setAttribute('variant', variant);
      return wc;
    },
  });
}
