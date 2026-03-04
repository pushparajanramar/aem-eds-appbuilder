import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'empty-state',
    label: 'Empty State',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const img = block.querySelector('img');
  const titleCol = rows.find((r) => !r.querySelector('img, picture'));
  const descCol = rows[rows.length - 1];

  if (titleCol) annotateField(titleCol, { prop: 'title', type: 'text', label: 'Title' });
  if (descCol && descCol !== titleCol) annotateField(descCol, { prop: 'description', type: 'richtext', label: 'Description' });

  const imageurl = img?.src || '';
  const imagealt = img?.alt || '';
  const title = titleCol?.textContent.trim() || '';
  const descriptionhtml = (descCol && descCol !== titleCol) ? descCol.innerHTML : '';

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    await import('/blocks/empty-state/qsr-empty-state.js');
    const wc = document.createElement('qsr-empty-state');
    wc.setAttribute('imageurl', imageurl);
    wc.setAttribute('imagealt', imagealt);
    wc.setAttribute('title', title);
    wc.setAttribute('descriptionhtml', descriptionhtml);
    block.replaceWith(wc);
  }, { rootMargin: '200px' });
  observer.observe(block);
}
