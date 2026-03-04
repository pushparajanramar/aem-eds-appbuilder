import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'combobox',
    label: 'Combobox',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const labelRow = rows[0];
  const optionRows = rows.slice(1);

  const labelCol = labelRow?.children[0] || labelRow;
  if (labelCol) annotateField(labelCol, { prop: 'label', type: 'text', label: 'Combobox Label' });

  const label = labelCol?.textContent.trim() || '';
  const options = optionRows.map((row, i) => {
    const col = row.children[0] || row;
    if (col) annotateField(col, { prop: `option-${i}`, type: 'text', label: `Option ${i + 1}` });
    return col?.textContent.trim() || '';
  }).filter(Boolean);

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    await import('/blocks/combobox/qsr-combobox.js');
    const wc = document.createElement('qsr-combobox');
    wc.setAttribute('label', label);
    wc.setAttribute('options', JSON.stringify(options));
    block.replaceWith(wc);
  }, { rootMargin: '200px' });
  observer.observe(block);
}
