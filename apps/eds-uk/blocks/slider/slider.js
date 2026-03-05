import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';
import { withLazyLoading } from '../../scripts/a11y.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'slider',
    label: 'Slider',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const labelCol = rows[0]?.children[0] || rows[0];
  const minCol = rows[1]?.children[0] || rows[1];
  const maxCol = rows[2]?.children[0] || rows[2];
  const valueCol = rows[3]?.children[0] || rows[3];

  if (labelCol) annotateField(labelCol, { prop: 'label', type: 'text', label: 'Slider Label' });

  const label = labelCol?.textContent.trim() || '';
  const min = minCol?.textContent.trim() || '0';
  const max = maxCol?.textContent.trim() || '100';
  const value = valueCol?.textContent.trim() || '50';

  withLazyLoading(block, {
    loadComponent: async () => {
      await import('/blocks/slider/qsr-slider.js');
      const wc = document.createElement('qsr-slider');
      wc.setAttribute('label', label);
      wc.setAttribute('min', min);
      wc.setAttribute('max', max);
      wc.setAttribute('value', value);
      return wc;
    },
  });
}
