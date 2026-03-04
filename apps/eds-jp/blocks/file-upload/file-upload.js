import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'file-upload',
    label: 'File Upload',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const labelCol = rows[0]?.children[0] || rows[0];
  const acceptCol = rows[1]?.children[0] || rows[1];

  if (labelCol) annotateField(labelCol, { prop: 'label', type: 'text', label: 'Upload Label' });

  const label = labelCol?.textContent.trim() || 'Upload file';
  const accept = acceptCol?.textContent.trim() || '';

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    await import('/blocks/file-upload/qsr-file-upload.js');
    const wc = document.createElement('qsr-file-upload');
    wc.setAttribute('label', label);
    wc.setAttribute('accept', accept);
    block.replaceWith(wc);
  }, { rootMargin: '200px' });
  observer.observe(block);
}
