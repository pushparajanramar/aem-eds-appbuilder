import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'table',
    label: 'Table',
  });

  const isNoHeader = block.classList.contains('no-header');
  const rows = [...block.children];

  const wrapper = document.createElement('div');
  wrapper.className = 'table__wrapper';

  const table = document.createElement('table');
  table.setAttribute('role', 'table');

  if (!isNoHeader && rows.length > 0) {
    const thead = document.createElement('thead');
    const tr = document.createElement('tr');
    [...rows[0].children].forEach((cell) => {
      const th = document.createElement('th');
      th.setAttribute('scope', 'col');
      annotateField(cell, { prop: 'header', type: 'richtext', label: 'Table Header' });
      th.innerHTML = cell.innerHTML;
      tr.append(th);
    });
    thead.append(tr);
    table.append(thead);
  }

  const tbody = document.createElement('tbody');
  const bodyRows = isNoHeader ? rows : rows.slice(1);
  bodyRows.forEach((row) => {
    const tr = document.createElement('tr');
    [...row.children].forEach((cell) => {
      const td = document.createElement('td');
      annotateField(cell, { prop: 'cell', type: 'richtext', label: 'Table Cell' });
      td.innerHTML = cell.innerHTML;
      tr.append(td);
    });
    tbody.append(tr);
  });

  table.append(tbody);
  wrapper.append(table);
  block.textContent = '';
  block.append(wrapper);
}
