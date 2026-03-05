import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';
import { withLazyLoading } from '../../scripts/a11y.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'progress-bar',
    label: 'Progress Bar',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const labelCol = rows[0]?.children[0] || rows[0];
  const valueCol = rows[1]?.children[0] || rows[1];

  if (labelCol) annotateField(labelCol, { prop: 'label', type: 'text', label: 'Progress Label' });
  if (valueCol) annotateField(valueCol, { prop: 'value', type: 'text', label: 'Progress Value' });

  const label = labelCol?.textContent.trim() || '';
  const value = valueCol?.textContent.trim() || '0';

  withLazyLoading(block, {
    loadComponent: async () => {
      await import('/blocks/progress-bar/qsr-progress-bar.js');
      const wc = document.createElement('qsr-progress-bar');
      wc.setAttribute('label', label);
      wc.setAttribute('value', value);
      return wc;
    },
  });
}
