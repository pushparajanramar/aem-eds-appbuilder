import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';
import { withLazyLoading } from '../../scripts/a11y.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'radio-button',
    label: 'Radio Button',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const items = rows.map((row, i) => {
    const labelCol = row.children[0];
    const valueCol = row.children[1];
    if (labelCol) annotateField(labelCol, { prop: `radio-label-${i}`, type: 'text', label: `Radio ${i + 1} Label` });
    return {
      label: labelCol?.textContent.trim() || `Option ${i + 1}`,
      value: valueCol?.textContent.trim() || '',
    };
  });

  withLazyLoading(block, {
    loadComponent: async () => {
      await import('/blocks/radio-button/qsr-radio-button.js');
      const wc = document.createElement('qsr-radio-button');
      wc.setAttribute('items', JSON.stringify(items));
      wc.setAttribute('name', block.dataset.name || 'radio-group');
      return wc;
    },
  });
}
