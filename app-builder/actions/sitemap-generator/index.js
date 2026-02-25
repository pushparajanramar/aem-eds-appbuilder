/**
 * Sitemap Generator Action
 *
 * Fetches all published pages from the EDS query index for a given market,
 * applies the include/exclude glob patterns from that market's sitemap.json,
 * builds a standards-compliant XML sitemap, and pushes it to the EDS CDN
 * via the Admin API (source PUT → publish POST).
 *
 * Endpoint: POST /api/v1/web/qsr/sitemap-generator
 * Auth: require-adobe-auth: true
 * Params:
 *   market    {string}          - Market code: us | uk | jp (default: us)
 *   EDS_TOKEN {string}          - EDS Admin API token (required when push=true)
 *   push      {boolean|string}  - Set to "false" to skip CDN push / dry-run (default: true)
 *   LOG_LEVEL {string}          - Logging verbosity (default: info)
 */

const { Core } = require('@adobe/aio-sdk');
const { getMarketConfig } = require('../shared/market-config');
const { logRequest } = require('../shared/datalog');

// ---------------------------------------------------------------------------
// Pure helpers (exported for unit testing)
// ---------------------------------------------------------------------------

/**
 * Parse the EDS org, repo and branch from an EDS host string.
 * Pattern: {branch}--{repo}--{org}.aem.live
 *
 * @param {string} edsHost - e.g. "main--qsr-us--org.aem.live"
 * @returns {{ org: string, repo: string, branch: string }}
 */
function parseEdsHost(edsHost) {
  const match = String(edsHost).match(/^([^.]+)--([^.]+)--([^.]+)\.aem\.live$/);
  if (match) {
    return { branch: match[1], repo: match[2], org: match[3] };
  }
  return { branch: 'main', repo: 'qsr-us', org: 'org' };
}

/**
 * Test whether a URL path matches a glob pattern.
 * Supported pattern forms:
 *   /             - exact root path
 *   /some/path    - exact match
 *   /prefix/**    - prefix subtree (path === prefix OR path starts with prefix/)
 *   /**?*         - any path that contains a query-string character '?'
 *
 * @param {string} path    - Absolute URL path (no query string), e.g. "/menu/item1"
 * @param {string} pattern - Glob pattern from sitemap.json include/exclude array
 * @returns {boolean}
 */
function matchesGlob(path, pattern) {
  if (!pattern || !path) return false;
  // /**?* — matches paths that contain a literal '?' (query strings)
  if (pattern === '/**?*') return path.includes('?');
  // Subtree glob: /prefix/**
  if (pattern.endsWith('/**')) {
    const prefix = pattern.slice(0, -3);
    return path === prefix || path.startsWith(`${prefix}/`);
  }
  // Exact match (including '/' root)
  return path === pattern;
}

/**
 * Determine whether a page path should appear in the sitemap.
 * A page is included when it matches at least one include pattern
 * and does not match any exclude pattern.
 *
 * @param {string}   path    - Page path, e.g. "/menu/grande-latte"
 * @param {string[]} include - Array of include glob patterns
 * @param {string[]} exclude - Array of exclude glob patterns
 * @returns {boolean}
 */
function shouldInclude(path, include, exclude) {
  if (exclude.some((p) => matchesGlob(path, p))) return false;
  return include.some((p) => matchesGlob(path, p));
}

/**
 * Escape XML special characters.
 *
 * @param {string} str
 * @returns {string}
 */
function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Build a standards-compliant XML sitemap string.
 * @see https://www.sitemaps.org/protocol.html
 *
 * Explicit entries from sitemap.json siteMap array take precedence and
 * preserve their authored changefreq / priority values.  Pages from the
 * query index that are not already covered by an explicit entry are appended
 * with only <loc> and (if present) <lastmod>.
 *
 * @param {string} siteBase
 *   Public origin to prepend to each path, e.g. "https://www.qsr.com"
 * @param {Array<{path: string, lastModified?: string}>} pages
 *   Pages from the EDS query index (already filtered by include/exclude).
 * @param {Array<{loc: string, changefreq?: string, priority?: string}>} [explicitEntries]
 *   Entries from the sitemap.json siteMap array (optional).
 * @returns {string} UTF-8 XML string
 */
function buildSitemapXml(siteBase, pages, explicitEntries = []) {
  // Index explicit entries by their pathname so we can deduplicate later.
  const explicitByPath = new Map();
  for (const entry of explicitEntries) {
    try {
      const { pathname } = new URL(entry.loc);
      explicitByPath.set(pathname, entry);
    } catch {
      // skip unparseable loc values
    }
  }

  const seen = new Set();
  const urlEntries = [];

  // Explicit entries first — they carry authored changefreq/priority.
  for (const [, entry] of explicitByPath) {
    seen.add(new URL(entry.loc).pathname);
    urlEntries.push(entry);
  }

  // Query-index pages that are not already covered by an explicit entry.
  for (const page of pages) {
    if (seen.has(page.path)) continue;
    seen.add(page.path);
    const entry = { loc: `${siteBase}${page.path}` };
    if (page.lastModified) entry.lastmod = page.lastModified;
    urlEntries.push(entry);
  }

  const urlElements = urlEntries
    .map((e) => {
      const lines = [`    <loc>${escapeXml(e.loc)}</loc>`];
      if (e.lastmod) lines.push(`    <lastmod>${escapeXml(e.lastmod)}</lastmod>`);
      if (e.changefreq) lines.push(`    <changefreq>${escapeXml(e.changefreq)}</changefreq>`);
      if (e.priority) lines.push(`    <priority>${escapeXml(String(e.priority))}</priority>`);
      return `  <url>\n${lines.join('\n')}\n  </url>`;
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urlElements,
    '</urlset>',
  ].join('\n');
}

/**
 * Derive a public site base URL (origin) for a market's sitemap entries.
 * Uses the origin of the first explicit siteMap entry when available;
 * otherwise falls back to the EDS live host.
 *
 * @param {string} edsHost - e.g. "main--qsr-us--org.aem.live"
 * @param {Array}  siteMap - Explicit entries from sitemap.json
 * @returns {string}       - e.g. "https://www.qsr.com"
 */
function deriveSiteBase(edsHost, siteMap) {
  if (Array.isArray(siteMap) && siteMap.length > 0) {
    try {
      return new URL(siteMap[0].loc).origin;
    } catch {
      // fall through
    }
  }
  return `https://${edsHost}`;
}

// ---------------------------------------------------------------------------
// Network helpers
// ---------------------------------------------------------------------------

/**
 * Fetch all published pages from the EDS query index, auto-paginating
 * until every entry has been retrieved.
 *
 * @param {string} edsHost
 * @returns {Promise<Array<{path: string, title: string, lastModified?: string}>>}
 */
async function fetchPageIndex(edsHost) {
  const limit = 256;
  let offset = 0;
  const pages = [];
  /* eslint-disable no-await-in-loop */
  while (true) {
    const url = `https://${edsHost}/query-index.json?limit=${limit}&offset=${offset}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Query index fetch failed (${res.status}): ${url}`);
    const json = await res.json();
    const data = Array.isArray(json.data) ? json.data : [];
    if (data.length === 0) break;
    pages.push(...data);
    offset += data.length;
    if (offset >= (json.total || pages.length)) break;
  }
  /* eslint-enable no-await-in-loop */
  return pages;
}

/**
 * Fetch the sitemap configuration (include/exclude patterns and explicit
 * entries) from the market's live EDS host.
 *
 * @param {string} edsHost
 * @returns {Promise<{ include: string[], exclude: string[], siteMap: Array }>}
 */
async function fetchSitemapConfig(edsHost) {
  const url = `https://${edsHost}/sitemap.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`sitemap.json fetch failed (${res.status}): ${url}`);
  return res.json();
}

/**
 * Push the generated XML sitemap to the EDS CDN via the Admin API.
 *
 * Step 1 — PUT /source  : upload the generated XML as source content.
 * Step 2 — POST /publish : promote the uploaded content to the live CDN.
 *
 * @param {string} org
 * @param {string} repo
 * @param {string} branch
 * @param {string} xml       - Sitemap XML string
 * @param {string} edsToken  - EDS Admin API bearer token
 * @returns {Promise<void>}
 */
async function pushSitemapToCdn(org, repo, branch, xml, edsToken) {
  const authHeader = { Authorization: `token ${edsToken}` };
  const sitemapPath = '/sitemap.xml';

  // Step 1: upload XML as source content
  const sourceUrl = `https://admin.hlx.page/source/${org}/${repo}/${branch}${sitemapPath}`;
  const sourceRes = await fetch(sourceUrl, {
    method: 'PUT',
    headers: { ...authHeader, 'Content-Type': 'text/xml; charset=utf-8' },
    body: xml,
  });
  if (!sourceRes.ok) {
    throw new Error(`Admin API source PUT failed (${sourceRes.status}): ${sourceUrl}`);
  }

  // Step 2: publish the uploaded content to CDN
  const publishUrl = `https://admin.hlx.page/publish/${org}/${repo}/${branch}${sitemapPath}`;
  const publishRes = await fetch(publishUrl, { method: 'POST', headers: authHeader });
  if (!publishRes.ok) {
    throw new Error(`Admin API publish POST failed (${publishRes.status}): ${publishUrl}`);
  }
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * @param {object} params
 * @param {string} [params.market='us']       - Market code: us | uk | jp
 * @param {string} [params.EDS_TOKEN]         - EDS Admin API token (required when push=true)
 * @param {boolean|string} [params.push=true] - Set to "false" for a dry-run (skips CDN push)
 * @param {string} [params.LOG_LEVEL='info']
 * @returns {Promise<{statusCode: number, headers: object, body: object}>}
 */
async function main(params) {
  const logger = Core.Logger('sitemap-generator', { level: params.LOG_LEVEL || 'info' });
  logRequest(logger, 'sitemap-generator', params);

  const market = params.market || 'us';
  const edsToken = params.EDS_TOKEN;
  const push = String(params.push ?? 'true') !== 'false';

  if (push && !edsToken) {
    return {
      statusCode: 400,
      headers: { 'content-type': 'application/json' },
      body: { error: 'EDS_TOKEN is required when push=true. Pass push=false for a dry-run.' },
    };
  }

  const { edsHost } = getMarketConfig(market);
  const { org, repo, branch } = parseEdsHost(edsHost);
  logger.info(`sitemap-generator: market=${market}, host=${edsHost}, push=${push}`);

  try {
    const [pages, sitemapConfig] = await Promise.all([
      fetchPageIndex(edsHost),
      fetchSitemapConfig(edsHost),
    ]);

    const { include = [], exclude = [], siteMap = [] } = sitemapConfig;
    const filteredPages = pages.filter((p) => shouldInclude(p.path, include, exclude));
    const siteBase = deriveSiteBase(edsHost, siteMap);
    const xml = buildSitemapXml(siteBase, filteredPages, siteMap);

    logger.info(`sitemap-generator: ${filteredPages.length} pages → sitemap.xml (${xml.length} bytes)`);

    if (push) {
      await pushSitemapToCdn(org, repo, branch, xml, edsToken);
      logger.info(`sitemap-generator: pushed sitemap.xml to CDN (${org}/${repo}/${branch})`);
    }

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: {
        result: 'ok',
        market,
        edsHost,
        pageCount: filteredPages.length,
        pushed: push,
        sitemapUrl: push ? `https://${edsHost}/sitemap.xml` : null,
      },
    };
  } catch (err) {
    logger.error('sitemap-generator error:', err);
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: { error: err.message },
    };
  }
}

module.exports = {
  main,
  // Exported for unit testing
  parseEdsHost,
  matchesGlob,
  shouldInclude,
  escapeXml,
  buildSitemapXml,
  deriveSiteBase,
};
