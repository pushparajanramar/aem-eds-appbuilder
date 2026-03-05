import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';
import { withLazyLoading } from '../../scripts/a11y.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'alert',
    label: 'Alert',
  });

  // Extract data from block structure
  // First row = alert variant (info, success, warning, error)
  // Second row = alert content (message)
  const rows = [...block.querySelectorAll(':scope > div')];
  const variantCol = rows[0]?.children[0] || rows[0];
  const contentCol = rows[1]?.children[0] || rows[1];

  if (variantCol) annotateField(variantCol, { prop: 'variant', type: 'text', label: 'Alert Variant' });
  if (contentCol) annotateField(contentCol, { prop: 'content', type: 'richtext', label: 'Alert Content' });

  const variant = variantCol?.textContent.trim() || 'info';
  const contenthtml = contentCol?.innerHTML || '';

  withLazyLoading(block, {
    loadComponent: async () => {
      await import('/blocks/alert/qsr-alert.js');
      const wc = document.createElement('qsr-alert');
      wc.setAttribute('variant', variant);
      wc.setAttribute('contenthtml', contenthtml);
      return wc;
    },
  });
}
