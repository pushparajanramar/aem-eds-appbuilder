import { toClassName } from '../../scripts/aem.js';
import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'tabs',
    label: 'Tabs',
  });

  window.adobeDataLayer = window.adobeDataLayer || [];

  const tabsId = `tabs-${Date.now()}`;
  const rows = [...block.children];

  const tabList = document.createElement('div');
  tabList.className = 'tabs__list';
  tabList.setAttribute('role', 'tablist');
  tabList.setAttribute('aria-label', 'Content Tabs');

  const panels = [];
  const tabBtns = [];

  rows.forEach((row, i) => {
    const labelCell = row.children[0];
    const contentCell = row.children[1];
    const label = labelCell ? labelCell.textContent.trim() : `Tab ${i + 1}`;
    const tabId = `${tabsId}-tab-${toClassName(label)}`;
    const panelId = `${tabsId}-panel-${toClassName(label)}`;

    annotateField(labelCell, { prop: `tab-${i}-label`, type: 'text', label: `Tab ${i + 1} Label` });
    if (contentCell) annotateField(contentCell, { prop: `tab-${i}-content`, type: 'richtext', label: `Tab ${i + 1} Content` });

    const btn = document.createElement('button');
    btn.className = 'tabs__tab';
    btn.setAttribute('role', 'tab');
    btn.setAttribute('id', tabId);
    btn.setAttribute('aria-controls', panelId);
    btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    btn.setAttribute('tabindex', i === 0 ? '0' : '-1');
    btn.textContent = label;

    const panel = document.createElement('div');
    panel.className = 'tabs__panel';
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('id', panelId);
    panel.setAttribute('aria-labelledby', tabId);
    panel.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
    if (contentCell) panel.append(...contentCell.childNodes);

    tabList.append(btn);
    tabBtns.push(btn);
    panels.push(panel);
  });

  function activateTab(index) {
    tabBtns.forEach((btn, i) => {
      const isActive = i === index;
      btn.setAttribute('aria-selected', isActive);
      btn.setAttribute('tabindex', isActive ? '0' : '-1');
      panels[i].setAttribute('aria-hidden', !isActive);
    });

    window.adobeDataLayer.push({
      event: 'component:tabs:change',
      component: {
        tabId: tabBtns[index]?.id,
        label: tabBtns[index]?.textContent.trim(),
      },
    });
  }

  tabBtns.forEach((btn, i) => {
    btn.addEventListener('click', () => activateTab(i));
    btn.addEventListener('keydown', (e) => {
      let next = i;
      if (e.key === 'ArrowRight') next = (i + 1) % tabBtns.length;
      else if (e.key === 'ArrowLeft') next = (i - 1 + tabBtns.length) % tabBtns.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabBtns.length - 1;
      else return;
      e.preventDefault();
      activateTab(next);
      tabBtns[next].focus();
    });
  });

  block.textContent = '';
  block.append(tabList, ...panels);
}
