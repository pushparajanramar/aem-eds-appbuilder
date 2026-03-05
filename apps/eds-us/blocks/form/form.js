import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';
import { withLazyLoading } from '../../scripts/a11y.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'form',
    label: 'Form',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  let action = '/submit';
  const fields = [];

  rows.forEach((row, i) => {
    const keyCell = row.children[0];
    const valCell = row.children[1];
    if (!keyCell) return;
    const key = keyCell.textContent.trim().toLowerCase();
    if (key === 'action') {
      action = valCell?.textContent.trim() || '/submit';
      return;
    }
    annotateField(keyCell, { prop: `field-${i}`, type: 'text', label: `Field ${i + 1}` });
    const type = key === 'textarea' ? 'textarea' : key === 'select' ? 'select' : 'text';
    const name = valCell?.children[0]?.textContent.trim() || `field_${i}`;
    const label = valCell?.children[1]?.textContent.trim() || name;
    const placeholder = valCell?.children[2]?.textContent.trim() || '';
    const required = valCell?.children[3]?.textContent.trim() === 'true';
    const optionsEl = valCell?.children[4];
    const options = optionsEl
      ? [...optionsEl.querySelectorAll('li')].map((li) => li.textContent.trim())
      : [];
    fields.push({ type, name, label, placeholder, required, options });
  });

  withLazyLoading(block, {
    loadComponent: async () => {
      await import('/blocks/form/qsr-form.js');
      const wc = document.createElement('qsr-form');
      wc.setAttribute('fields', JSON.stringify(fields));
      wc.setAttribute('action', action);
      return wc;
    },
  });
}
