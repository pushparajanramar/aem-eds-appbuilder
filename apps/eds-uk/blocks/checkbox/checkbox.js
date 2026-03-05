import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';
import { withLazyLoading } from '../../scripts/a11y.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'checkbox',
    label: 'Checkbox',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const items = rows.map((row, i) => {
    const labelCol = row.children[0];
    const valueCol = row.children[1];
    if (labelCol) annotateField(labelCol, { prop: `checkbox-label-${i}`, type: 'text', label: `Checkbox ${i + 1} Label` });
    return {
      label: labelCol?.textContent.trim() || `Option ${i + 1}`,
      value: valueCol?.textContent.trim() || '',
      checked: block.classList.contains('checked'),
    };
  });

  withLazyLoading(block, {
    loadComponent: async () => {
      await import('/blocks/checkbox/qsr-checkbox.js');
      const wc = document.createElement('qsr-checkbox');
      wc.setAttribute('items', JSON.stringify(items));
      return wc;
    },
  });
}
