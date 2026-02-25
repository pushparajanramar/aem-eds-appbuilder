import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'columns',
    label: 'Columns',
  });

  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  cols.forEach((col, i) => {
    const img = col.querySelector('img');
    const picture = col.querySelector('picture');
    const hasPictureOnly = picture && col.textContent.trim() === '';

    if (hasPictureOnly || picture) {
      col.classList.add('columns__img-col');
      if (img) {
        annotateField(picture || img, { prop: `col-${i}-image`, type: 'media', label: `Column ${i + 1} Image` });
        img.setAttribute('loading', 'lazy');
        img.setAttribute('decoding', 'async');
      }
    } else {
      const text = col.querySelector('p, h2, h3');
      if (text) {
        annotateField(text, { prop: `col-${i}-content`, type: 'richtext', label: `Column ${i + 1} Content` });
      }
    }
  });
}
