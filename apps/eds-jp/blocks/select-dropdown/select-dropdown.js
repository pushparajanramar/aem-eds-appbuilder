import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';
import { withLazyLoading } from '../../scripts/a11y.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'select-dropdown',
    label: 'Select Dropdown',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const labelRow = rows[0];
  const optionRows = rows.slice(1);

  const labelCol = labelRow?.children[0] || labelRow;
  if (labelCol) annotateField(labelCol, { prop: 'label', type: 'text', label: 'Select Label' });

  const label = labelCol?.textContent.trim() || '';
  const options = optionRows.map((row, i) => {
    const col = row.children[0] || row;
    if (col) annotateField(col, { prop: `option-${i}`, type: 'text', label: `Option ${i + 1}` });
    return col?.textContent.trim() || '';
  }).filter(Boolean);

  withLazyLoading(block, {
    loadComponent: async () => {
      await import('/blocks/select-dropdown/qsr-select-dropdown.js');
      const wc = document.createElement('qsr-select-dropdown');
      wc.setAttribute('label', label);
      wc.setAttribute('options', JSON.stringify(options));
      return wc;
    },
  });
}
