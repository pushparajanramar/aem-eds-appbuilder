import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'hero',
    label: 'Hero',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const imgCol = block.querySelector('picture, img');
  const img = block.querySelector('img');
  if (img) {
    const imgContainer = img.closest('div') || rows[0]?.children[0];
    if (imgContainer) annotateField(imgContainer, { prop: 'image', type: 'media', label: 'Hero Image' });
  }

  const contentRow = rows.find((r) => !r.querySelector('img, picture'));
  if (contentRow) annotateField(contentRow, { prop: 'content', type: 'richtext', label: 'Hero Content' });

  const imageurl = img?.src || '';
  const imagealt = img?.alt || '';
  const contenthtml = contentRow?.innerHTML || '';

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    await import('/blocks/hero/qsr-hero.js');
    const wc = document.createElement('qsr-hero');
    wc.setAttribute('imageurl', imageurl);
    wc.setAttribute('imagealt', imagealt);
    wc.setAttribute('contenthtml', contenthtml);
    wc.setAttribute('devicetype', document.documentElement.dataset.device || 'desktop');
    block.replaceWith(wc);
  }, { rootMargin: '200px' });
  observer.observe(block);
}
