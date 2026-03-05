import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';
import { withLazyLoading } from '../../scripts/a11y.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'image',
    label: 'Image',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const img = block.querySelector('img');
  const captionCol = rows.find((r) => !r.querySelector('img, picture'));

  if (img) {
    const imgContainer = img.closest('div') || rows[0]?.children[0];
    if (imgContainer) annotateField(imgContainer, { prop: 'image', type: 'media', label: 'Image' });
  }
  if (captionCol) annotateField(captionCol, { prop: 'caption', type: 'text', label: 'Caption' });

  const imageurl = img?.src || '';
  const imagealt = img?.alt || '';
  const caption = captionCol?.textContent.trim() || '';

  withLazyLoading(block, {
    loadComponent: async () => {
      await import('/blocks/image/qsr-image.js');
      const wc = document.createElement('qsr-image');
      wc.setAttribute('imageurl', imageurl);
      wc.setAttribute('imagealt', imagealt);
      wc.setAttribute('caption', caption);
      return wc;
    },
  });
}
