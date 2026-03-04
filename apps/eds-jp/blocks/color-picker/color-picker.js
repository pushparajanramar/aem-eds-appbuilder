import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'color-picker',
    label: 'Color Picker',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const labelCol = rows[0]?.children[0] || rows[0];
  const valueCol = rows[1]?.children[0] || rows[1];

  if (labelCol) annotateField(labelCol, { prop: 'label', type: 'text', label: 'Color Picker Label' });
  if (valueCol) annotateField(valueCol, { prop: 'value', type: 'text', label: 'Default Color' });

  const label = labelCol?.textContent.trim() || 'Color';
  const value = valueCol?.textContent.trim() || '#00704a';

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    await import('/blocks/color-picker/qsr-color-picker.js');
    const wc = document.createElement('qsr-color-picker');
    wc.setAttribute('label', label);
    wc.setAttribute('value', value);
    block.replaceWith(wc);
  }, { rootMargin: '200px' });
  observer.observe(block);
}
