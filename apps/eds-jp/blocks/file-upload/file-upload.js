import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';
import { withLazyLoading } from '../../scripts/a11y.js';

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

  withLazyLoading(block, {
    loadComponent: async () => {
      await import('/blocks/file-upload/qsr-file-upload.js');
      const wc = document.createElement('qsr-file-upload');
      wc.setAttribute('label', label);
      wc.setAttribute('accept', accept);
      return wc;
    },
  });
}
