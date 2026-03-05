import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';
import { withLazyLoading } from '../../scripts/a11y.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'spinner',
    label: 'Spinner',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const labelCol = rows[0]?.children[0] || rows[0];

  if (labelCol) annotateField(labelCol, { prop: 'label', type: 'text', label: 'Loading Label' });

  const label = labelCol?.textContent.trim() || 'Loading…';
  const size = block.classList.contains('large') ? 'large' : block.classList.contains('small') ? 'small' : 'medium';

  withLazyLoading(block, {
    loadComponent: async () => {
      await import('/blocks/spinner/qsr-spinner.js');
      const wc = document.createElement('qsr-spinner');
      wc.setAttribute('label', label);
      wc.setAttribute('size', size);
      return wc;
    },
  });
}
