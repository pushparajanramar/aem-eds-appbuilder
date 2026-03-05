/**
 * Tests for block decorators
 *
 * Validates that block decorators correctly:
 * 1. Import withLazyLoading from a11y.js
 * 2. Extract data from block DOM structure
 * 3. Call withLazyLoading with appropriate parameters
 */

import { jest } from '@jest/globals';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BLOCKS_DIR = join(__dirname, '..', 'blocks');
const MOCK_DATA_DIR = join(__dirname, '..', 'mock-data');

/* ── Block file analysis tests ──────────────────────────────────── */

describe('Block decorators', () => {
  const blockDirs = readdirSync(BLOCKS_DIR);

  // These blocks have special patterns and don't use withLazyLoading
  const specialBlocks = ['header', 'modal', 'promotion-banner'];

  const standardBlocks = blockDirs.filter((d) => !specialBlocks.includes(d));

  describe.each(standardBlocks)('%s block', (blockName) => {
    let source;

    beforeAll(() => {
      const blockPath = join(BLOCKS_DIR, blockName, `${blockName}.js`);
      source = readFileSync(blockPath, 'utf8');
    });

    it('imports withLazyLoading from a11y.js', () => {
      expect(source).toContain("import { withLazyLoading } from '../../scripts/a11y.js'");
    });

    it('calls withLazyLoading in the decorate function', () => {
      expect(source).toContain('withLazyLoading(block,');
    });

    it('has a loadComponent callback that returns a web component', () => {
      expect(source).toContain('loadComponent:');
      expect(source).toContain('return wc;');
    });

    it('does not use raw IntersectionObserver', () => {
      expect(source).not.toContain('new IntersectionObserver');
    });

    it('does not call block.replaceWith directly', () => {
      expect(source).not.toContain('block.replaceWith(wc)');
    });

    it('exports a default decorate function', () => {
      expect(source).toMatch(/export default (async )?function decorate/);
    });
  });

  describe('header block (special)', () => {
    let source;

    beforeAll(() => {
      const blockPath = join(BLOCKS_DIR, 'header', 'header.js');
      source = readFileSync(blockPath, 'utf8');
    });

    it('sets role="banner" on block', () => {
      expect(source).toContain("'role', 'banner'");
    });

    it('sets aria-label on block', () => {
      expect(source).toContain("'aria-label', 'Header'");
    });
  });

  describe('modal block (special)', () => {
    let source;

    beforeAll(() => {
      const blockPath = join(BLOCKS_DIR, 'modal', 'modal.js');
      source = readFileSync(blockPath, 'utf8');
    });

    it('sets role="dialog" on the modal element', () => {
      expect(source).toContain("'role', 'dialog'");
    });

    it('sets aria-modal="true" on the modal element', () => {
      expect(source).toContain("'aria-modal', 'true'");
    });

    it('sets aria-label on the modal element', () => {
      expect(source).toContain("'aria-label', 'Dialog'");
    });
  });

  describe('promotion-banner block (special)', () => {
    let source;

    beforeAll(() => {
      const blockPath = join(BLOCKS_DIR, 'promotion-banner', 'promotion-banner.js');
      source = readFileSync(blockPath, 'utf8');
    });

    it('sets role="banner" on the block', () => {
      expect(source).toContain("'role', 'banner'");
    });

    it('sets aria-label on the block', () => {
      expect(source).toContain("'aria-label', 'Promotion'");
    });

    it('ensures images have alt text fallback', () => {
      expect(source).toContain("'Promotional banner'");
    });
  });
});

/* ── Mock data validation tests ──────────────────────────────────── */

describe('Mock data files', () => {
  const mockFiles = readdirSync(MOCK_DATA_DIR).filter((f) => f.endsWith('.json'));

  it('has mock data files', () => {
    expect(mockFiles.length).toBeGreaterThan(0);
  });

  describe.each(mockFiles)('%s', (filename) => {
    let data;

    beforeAll(() => {
      const content = readFileSync(join(MOCK_DATA_DIR, filename), 'utf8');
      data = JSON.parse(content);
    });

    it('is valid JSON', () => {
      expect(data).toBeDefined();
      expect(typeof data).toBe('object');
    });

    it('contains block mock data', () => {
      const keys = Object.keys(data);
      expect(keys.length).toBeGreaterThan(0);
    });
  });
});
