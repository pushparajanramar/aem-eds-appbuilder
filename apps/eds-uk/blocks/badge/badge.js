import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';
import { withLazyLoading } from '../../scripts/a11y.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'badge',
    label: 'Badge',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const labelCol = rows[0]?.children[0] || rows[0];
  const variantCol = rows[1]?.children[0] || rows[1];

  if (labelCol) annotateField(labelCol, { prop: 'label', type: 'text', label: 'Badge Label' });
  if (variantCol) annotateField(variantCol, { prop: 'variant', type: 'text', label: 'Badge Variant' });

  const label = labelCol?.textContent.trim() || '';
  const variant = variantCol?.textContent.trim() || 'default';

  withLazyLoading(block, {
    loadComponent: async () => {
      await import('/blocks/badge/qsr-badge.js');
      const wc = document.createElement('qsr-badge');
      wc.setAttribute('label', label);
      wc.setAttribute('variant', variant);
      return wc;
    },
  });
}
