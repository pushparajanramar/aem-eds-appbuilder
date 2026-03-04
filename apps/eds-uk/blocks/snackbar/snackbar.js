import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'snackbar',
    label: 'Snackbar',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const messageCol = rows[0]?.children[0] || rows[0];
  const actionCol = rows[1]?.children[0] || rows[1];

  if (messageCol) annotateField(messageCol, { prop: 'message', type: 'text', label: 'Message' });
  if (actionCol) annotateField(actionCol, { prop: 'action', type: 'text', label: 'Action Label' });

  const message = messageCol?.textContent.trim() || '';
  const action = actionCol?.textContent.trim() || '';

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    await import('/blocks/snackbar/qsr-snackbar.js');
    const wc = document.createElement('qsr-snackbar');
    wc.setAttribute('message', message);
    wc.setAttribute('action', action);
    block.replaceWith(wc);
  }, { rootMargin: '200px' });
  observer.observe(block);
}
