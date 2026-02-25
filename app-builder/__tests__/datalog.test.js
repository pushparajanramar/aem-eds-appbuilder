/**
 * Tests for shared/datalog.js
 */

const fs = require('fs');
const { logRequest, DATALOG_FALLBACK_PATH } = require('../actions/shared/datalog');

describe('datalog', () => {
  describe('logRequest', () => {
    it('logs a datalog record with type "datalog"', () => {
      const logger = { info: jest.fn() };
      logRequest(logger, 'device-provider', { market: 'us' });
      expect(logger.info).toHaveBeenCalledTimes(1);
      const record = JSON.parse(logger.info.mock.calls[0][0]);
      expect(record.type).toBe('datalog');
    });

    it('logs the action name', () => {
      const logger = { info: jest.fn() };
      logRequest(logger, 'menu-provider', {});
      const record = JSON.parse(logger.info.mock.calls[0][0]);
      expect(record.action).toBe('menu-provider');
    });

    it('logs the market from params', () => {
      const logger = { info: jest.fn() };
      logRequest(logger, 'store-provider', { market: 'uk' });
      const record = JSON.parse(logger.info.mock.calls[0][0]);
      expect(record.market).toBe('uk');
    });

    it('defaults market to "us" when not provided', () => {
      const logger = { info: jest.fn() };
      logRequest(logger, 'webhook', {});
      const record = JSON.parse(logger.info.mock.calls[0][0]);
      expect(record.market).toBe('us');
    });

    it('logs the HTTP method from __ow_method', () => {
      const logger = { info: jest.fn() };
      logRequest(logger, 'bff-proxy', { __ow_method: 'post' });
      const record = JSON.parse(logger.info.mock.calls[0][0]);
      expect(record.method).toBe('POST');
    });

    it('defaults method to "GET" when __ow_method is absent', () => {
      const logger = { info: jest.fn() };
      logRequest(logger, 'rewards-provider', {});
      const record = JSON.parse(logger.info.mock.calls[0][0]);
      expect(record.method).toBe('GET');
    });

    it('includes a timestamp in ISO 8601 format', () => {
      const logger = { info: jest.fn() };
      logRequest(logger, 'user-provider', {});
      const record = JSON.parse(logger.info.mock.calls[0][0]);
      expect(record.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('filesystem fallback', () => {
    let appendFileSyncSpy;

    beforeEach(() => {
      appendFileSyncSpy = jest.spyOn(fs, 'appendFileSync').mockImplementation(() => {});
    });

    afterEach(() => {
      appendFileSyncSpy.mockRestore();
    });

    it('writes to the fallback file when logger.info throws', () => {
      const logger = { info: jest.fn().mockImplementation(() => { throw new Error('datalog unavailable'); }) };
      logRequest(logger, 'device-provider', { market: 'jp', __ow_method: 'get' });
      expect(appendFileSyncSpy).toHaveBeenCalledTimes(1);
      const [path, content] = appendFileSyncSpy.mock.calls[0];
      expect(path).toBe(DATALOG_FALLBACK_PATH);
      const record = JSON.parse(content.trim());
      expect(record.type).toBe('datalog');
      expect(record.action).toBe('device-provider');
      expect(record.market).toBe('jp');
      expect(record.method).toBe('GET');
    });

    it('uses the correct fallback path constant', () => {
      expect(DATALOG_FALLBACK_PATH).toBe('/tmp/datalog.log');
    });

    it('does not write to filesystem when logger.info succeeds', () => {
      const logger = { info: jest.fn() };
      logRequest(logger, 'webhook', { market: 'us' });
      expect(appendFileSyncSpy).not.toHaveBeenCalled();
    });

    it('appends a newline-terminated JSON line to the fallback file', () => {
      const logger = { info: jest.fn().mockImplementation(() => { throw new Error('down'); }) };
      logRequest(logger, 'menu-provider', {});
      const written = appendFileSyncSpy.mock.calls[0][1];
      expect(written.endsWith('\n')).toBe(true);
      expect(() => JSON.parse(written.trim())).not.toThrow();
    });
  });
});
