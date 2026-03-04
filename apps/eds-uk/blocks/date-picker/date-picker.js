import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'date-picker',
    label: 'Date Picker',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const labelCol = rows[0]?.children[0] || rows[0];
  const placeholderCol = rows[1]?.children[0] || rows[1];

  if (labelCol) annotateField(labelCol, { prop: 'label', type: 'text', label: 'Date Picker Label' });
  if (placeholderCol) annotateField(placeholderCol, { prop: 'placeholder', type: 'text', label: 'Placeholder' });

  const label = labelCol?.textContent.trim() || 'Select date';
  const placeholder = placeholderCol?.textContent.trim() || 'mm/dd/yyyy';

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    await import('/blocks/date-picker/qsr-date-picker.js');
    const wc = document.createElement('qsr-date-picker');
    wc.setAttribute('label', label);
    wc.setAttribute('placeholder', placeholder);
    block.replaceWith(wc);
  }, { rootMargin: '200px' });
  observer.observe(block);
}
