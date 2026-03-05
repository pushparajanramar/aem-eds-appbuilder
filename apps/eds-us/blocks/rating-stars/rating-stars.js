import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';
import { withLazyLoading } from '../../scripts/a11y.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'rating-stars',
    label: 'Rating Stars',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const valueCol = rows[0]?.children[0] || rows[0];
  const maxCol = rows[1]?.children[0] || rows[1];

  if (valueCol) annotateField(valueCol, { prop: 'value', type: 'text', label: 'Rating Value' });
  if (maxCol) annotateField(maxCol, { prop: 'max', type: 'text', label: 'Max Rating' });

  const value = valueCol?.textContent.trim() || '0';
  const max = maxCol?.textContent.trim() || '5';
  const readonly = block.classList.contains('readonly') ? 'true' : 'false';

  withLazyLoading(block, {
    loadComponent: async () => {
      await import('/blocks/rating-stars/qsr-rating-stars.js');
      const wc = document.createElement('qsr-rating-stars');
      wc.setAttribute('value', value);
      wc.setAttribute('max', max);
      wc.setAttribute('readonly', readonly);
      return wc;
    },
  });
}
