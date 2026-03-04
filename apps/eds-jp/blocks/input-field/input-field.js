import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'input-field',
    label: 'Input Field',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const labelCol = rows[0]?.children[0] || rows[0];
  const placeholderCol = rows[1]?.children[0] || rows[1];
  const typeCol = rows[2]?.children[0] || rows[2];

  if (labelCol) annotateField(labelCol, { prop: 'label', type: 'text', label: 'Field Label' });
  if (placeholderCol) annotateField(placeholderCol, { prop: 'placeholder', type: 'text', label: 'Placeholder' });

  const label = labelCol?.textContent.trim() || '';
  const placeholder = placeholderCol?.textContent.trim() || '';
  const inputtype = typeCol?.textContent.trim() || 'text';

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    await import('/blocks/input-field/qsr-input-field.js');
    const wc = document.createElement('qsr-input-field');
    wc.setAttribute('label', label);
    wc.setAttribute('placeholder', placeholder);
    wc.setAttribute('inputtype', inputtype);
    block.replaceWith(wc);
  }, { rootMargin: '200px' });
  observer.observe(block);
}
