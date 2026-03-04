import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'avatar',
    label: 'Avatar',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const img = block.querySelector('img');
  if (img) {
    const imgContainer = img.closest('div') || rows[0]?.children[0];
    if (imgContainer) annotateField(imgContainer, { prop: 'image', type: 'media', label: 'Avatar Image' });
  }

  const nameCol = rows.find((r) => !r.querySelector('img, picture'));
  if (nameCol) annotateField(nameCol, { prop: 'name', type: 'text', label: 'Name' });

  const imageurl = img?.src || '';
  const imagealt = img?.alt || '';
  const name = nameCol?.textContent.trim() || '';
  const size = block.classList.contains('large') ? 'large' : block.classList.contains('small') ? 'small' : 'medium';

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    await import('/blocks/avatar/qsr-avatar.js');
    const wc = document.createElement('qsr-avatar');
    wc.setAttribute('imageurl', imageurl);
    wc.setAttribute('imagealt', imagealt);
    wc.setAttribute('name', name);
    wc.setAttribute('size', size);
    block.replaceWith(wc);
  }, { rootMargin: '200px' });
  observer.observe(block);
}
