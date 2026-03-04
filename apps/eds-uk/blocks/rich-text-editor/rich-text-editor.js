import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'rich-text-editor',
    label: 'Rich Text Editor',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const contentCol = rows[0]?.children[0] || rows[0];

  if (contentCol) annotateField(contentCol, { prop: 'content', type: 'richtext', label: 'Content' });

  const contenthtml = contentCol?.innerHTML || '';
  const placeholder = block.dataset.placeholder || 'Start typing...';

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    await import('/blocks/rich-text-editor/qsr-rich-text-editor.js');
    const wc = document.createElement('qsr-rich-text-editor');
    wc.setAttribute('contenthtml', contenthtml);
    wc.setAttribute('placeholder', placeholder);
    block.replaceWith(wc);
  }, { rootMargin: '200px' });
  observer.observe(block);
}
