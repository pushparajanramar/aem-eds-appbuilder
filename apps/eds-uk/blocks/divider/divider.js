import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';
import { withLazyLoading } from '../../scripts/a11y.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'divider',
    label: 'Divider',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const labelCol = rows[0]?.children[0] || rows[0];

  if (labelCol) annotateField(labelCol, { prop: 'label', type: 'text', label: 'Divider Label' });

  const label = labelCol?.textContent.trim() || '';
  const variant = block.classList.contains('dashed') ? 'dashed'
    : block.classList.contains('dotted') ? 'dotted' : 'solid';

  withLazyLoading(block, {
    loadComponent: async () => {
      await import('/blocks/divider/qsr-divider.js');
      const wc = document.createElement('qsr-divider');
      wc.setAttribute('label', label);
      wc.setAttribute('variant', variant);
      return wc;
    },
  });
}
