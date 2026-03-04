/**
 * Sitemap Generator Handler — Fastly Compute edge function
 *
 * Fetches all published pages from the EDS query index for a given market,
 * applies the include/exclude glob patterns from that market's sitemap.json,
 * builds a standards-compliant XML sitemap, and pushes it to the EDS CDN
 * via the Admin API.
 */

import { getMarketConfig } from '../shared/market-config.js';
import { logRequest, logError } from '../shared/datalog.js';

/**
 * Parse the EDS org, repo and branch from an EDS host string.
 *
 * @param {string} edsHost
 * @returns {{ org: string, repo: string, branch: string }}
 */
export function parseEdsHost(edsHost) {
  const match = String(edsHost).match(/^([^.]+)--([^.]+)--([^.]+)\.aem\.live$/);
  if (match) {
    return { branch: match[1], repo: match[2], org: match[3] };
  }
  return { branch: 'main', repo: 'qsr-us', org: 'org' };
}

/**
 * Test whether a URL path matches a glob pattern.
 *
 * @param {string} path
 * @param {string} pattern
 * @returns {boolean}
 */
export function matchesGlob(path, pattern) {
  if (!pattern || !path) return false;
  if (pattern === '/**?*') return path.includes('?');
  if (pattern.endsWith('/**')) {
    const prefix = pattern.slice(0, -3);
    return path === prefix || path.startsWith(`${prefix}/`);
  }
  return path === pattern;
}

/**
 * Determine whether a page path should appear in the sitemap.
 *
 * @param {string} path
 * @param {string[]} include
 * @param {string[]} exclude
 * @returns {boolean}
 */
export function shouldInclude(path, include, exclude) {
  if (exclude.some((p) => matchesGlob(path, p))) return false;
  return include.some((p) => matchesGlob(path, p));
}

/**
 * Escape XML special characters.
 *
 * @param {string} str
 * @returns {string}
 */
export function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Build a standards-compliant XML sitemap string.
 *
 * @param {string} siteBase
 * @param {Array<{path: string, lastModified?: string}>} pages
 * @param {Array<{loc: string, changefreq?: string, priority?: string}>} [explicitEntries]
 * @returns {string}
 */
export function buildSitemapXml(siteBase, pages, explicitEntries = []) {
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

  for (const [, entry] of explicitByPath) {
    seen.add(new URL(entry.loc).pathname);
    urlEntries.push(entry);
  }

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
 * Derive a public site base URL for a market's sitemap entries.
 *
 * @param {string} edsHost
 * @param {Array} siteMap
 * @returns {string}
 */
export function deriveSiteBase(edsHost, siteMap) {
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

async function fetchPageIndex(edsHost) {
  const limit = 256;
  let offset = 0;
  const pages = [];
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
  return pages;
}

async function fetchSitemapConfig(edsHost) {
  const url = `https://${edsHost}/sitemap.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`sitemap.json fetch failed (${res.status}): ${url}`);
  return res.json();
}

async function pushSitemapToCdn(org, repo, branch, xml, edsToken) {
  const authHeader = { Authorization: `token ${edsToken}` };
  const sitemapPath = '/sitemap.xml';

  const sourceUrl = `https://admin.hlx.page/source/${org}/${repo}/${branch}${sitemapPath}`;
  const sourceRes = await fetch(sourceUrl, {
    method: 'PUT',
    headers: { ...authHeader, 'Content-Type': 'text/xml; charset=utf-8' },
    body: xml,
  });
  if (!sourceRes.ok) {
    throw new Error(`Admin API source PUT failed (${sourceRes.status}): ${sourceUrl}`);
  }

  const publishUrl = `https://admin.hlx.page/publish/${org}/${repo}/${branch}${sitemapPath}`;
  const publishRes = await fetch(publishUrl, { method: 'POST', headers: authHeader });
  if (!publishRes.ok) {
    throw new Error(`Admin API publish POST failed (${publishRes.status}): ${publishUrl}`);
  }
}

/**
 * Handle sitemap-generator request.
 *
 * @param {Request} req
 * @returns {Promise<Response>}
 */
export async function handleSitemapGenerator(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const market = body.market || 'us';
  const edsToken = body.EDS_TOKEN || req.headers.get('x-eds-token') || '';
  const push = String(body.push ?? 'true') !== 'false';

  logRequest('sitemap-generator', req, market);

  if (push && !edsToken) {
    logError('sitemap-generator', req, market, 'EDS_TOKEN is required when push=true', 400);
    return new Response(
      JSON.stringify({ error: 'EDS_TOKEN is required when push=true. Pass push=false for a dry-run.' }),
      { status: 400, headers: { 'content-type': 'application/json' } },
    );
  }

  const { edsHost } = getMarketConfig(market);
  const { org, repo, branch } = parseEdsHost(edsHost);

  try {
    const [pages, sitemapConfig] = await Promise.all([
      fetchPageIndex(edsHost),
      fetchSitemapConfig(edsHost),
    ]);

    const { include = [], exclude = [], siteMap = [] } = sitemapConfig;
    const filteredPages = pages.filter((p) => shouldInclude(p.path, include, exclude));
    const siteBase = deriveSiteBase(edsHost, siteMap);
    const xml = buildSitemapXml(siteBase, filteredPages, siteMap);

    if (push) {
      await pushSitemapToCdn(org, repo, branch, xml, edsToken);
    }

    return new Response(JSON.stringify({
      result: 'ok',
      market,
      edsHost,
      pageCount: filteredPages.length,
      pushed: push,
      sitemapUrl: push ? `https://${edsHost}/sitemap.xml` : null,
    }), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    console.error('sitemap-generator error:', err);
    logError('sitemap-generator', req, market, err, 500);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
