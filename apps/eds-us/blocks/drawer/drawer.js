import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'drawer',
    label: 'Drawer',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const titleCol = rows[0]?.children[0] || rows[0];
  const contentCol = rows[1]?.children[0] || rows[1];

  if (titleCol) annotateField(titleCol, { prop: 'title', type: 'text', label: 'Drawer Title' });
  if (contentCol) annotateField(contentCol, { prop: 'content', type: 'richtext', label: 'Drawer Content' });

  const title = titleCol?.textContent.trim() || '';
  const contenthtml = contentCol?.innerHTML || '';
  const position = block.classList.contains('right') ? 'right' : 'left';

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    await import('/blocks/drawer/qsr-drawer.js');
    const wc = document.createElement('qsr-drawer');
    wc.setAttribute('title', title);
    wc.setAttribute('contenthtml', contenthtml);
    wc.setAttribute('position', position);
    block.replaceWith(wc);
  }, { rootMargin: '200px' });
  observer.observe(block);
}
