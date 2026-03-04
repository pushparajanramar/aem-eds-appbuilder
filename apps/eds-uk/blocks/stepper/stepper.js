import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'stepper',
    label: 'Stepper',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const steps = rows.map((row, i) => {
    const labelCol = row.children[0];
    const descCol = row.children[1];
    if (labelCol) annotateField(labelCol, { prop: `step-label-${i}`, type: 'text', label: `Step ${i + 1} Label` });
    if (descCol) annotateField(descCol, { prop: `step-desc-${i}`, type: 'text', label: `Step ${i + 1} Description` });
    return {
      label: labelCol?.textContent.trim() || `Step ${i + 1}`,
      description: descCol?.textContent.trim() || '',
    };
  });

  const currentStep = block.dataset.current || '1';

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    await import('/blocks/stepper/qsr-stepper.js');
    const wc = document.createElement('qsr-stepper');
    wc.setAttribute('steps', JSON.stringify(steps));
    wc.setAttribute('current', currentStep);
    block.replaceWith(wc);
  }, { rootMargin: '200px' });
  observer.observe(block);
}
