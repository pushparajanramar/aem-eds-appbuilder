/*
 * Breadcrumbs Block
 * Display page navigation hierarchy
 */

function buildBreadcrumbItems(navPages) {
  const breadcrumbItems = [];

  navPages.forEach((page, index) => {
    const isLast = index === navPages.length - 1;
    const li = document.createElement('li');

    if (isLast) {
      li.classList.add('breadcrumbs-item-active');
      li.textContent = page.title;
      li.setAttribute('aria-current', 'page');
    } else {
      const link = document.createElement('a');
      link.href = page.path;
      link.textContent = page.title;
      li.appendChild(link);
    }

    breadcrumbItems.push(li);
  });

  return breadcrumbItems;
}

export default function decorate(block) {
  const navPages = [];

  // Extract breadcrumb data from block
  [...block.children].forEach((row) => {
    const link = row.querySelector('a');
    if (link) {
      navPages.push({
        title: link.textContent.trim(),
        path: link.getAttribute('href'),
      });
    } else {
      navPages.push({
        title: row.textContent.trim(),
      });
    }
  });

  // Build breadcrumb navigation
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Breadcrumb');

  const ol = document.createElement('ol');
  ol.classList.add('breadcrumbs-list');

  const items = buildBreadcrumbItems(navPages);
  items.forEach((item) => ol.appendChild(item));

  nav.appendChild(ol);
  block.textContent = '';
  block.appendChild(nav);
}
