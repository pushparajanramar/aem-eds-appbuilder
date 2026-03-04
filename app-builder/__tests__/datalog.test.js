/**
 * Tests for shared/datalog.js
 */

const fs = require('fs');
const { logRequest, logError, shouldLog, DATALOG_FALLBACK_PATH } = require('../actions/shared/datalog');

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

    it('includes level "info" in the record', () => {
      const logger = { info: jest.fn() };
      logRequest(logger, 'device-provider', {});
      const record = JSON.parse(logger.info.mock.calls[0][0]);
      expect(record.level).toBe('info');
    });
  });

  describe('logError', () => {
    it('logs a datalog error record with level "error"', () => {
      const logger = { info: jest.fn() };
      logError(logger, 'menu-provider', { market: 'us' }, new Error('upstream failed'), 500);
      expect(logger.info).toHaveBeenCalledTimes(1);
      const record = JSON.parse(logger.info.mock.calls[0][0]);
      expect(record.type).toBe('datalog');
      expect(record.level).toBe('error');
      expect(record.action).toBe('menu-provider');
      expect(record.statusCode).toBe(500);
      expect(record.error).toBe('upstream failed');
    });

    it('logs the action name and market', () => {
      const logger = { info: jest.fn() };
      logError(logger, 'store-provider', { market: 'uk' }, new Error('timeout'), 502);
      const record = JSON.parse(logger.info.mock.calls[0][0]);
      expect(record.action).toBe('store-provider');
      expect(record.market).toBe('uk');
      expect(record.statusCode).toBe(502);
    });

    it('handles string errors', () => {
      const logger = { info: jest.fn() };
      logError(logger, 'webhook', {}, 'Missing required param: path', 400);
      const record = JSON.parse(logger.info.mock.calls[0][0]);
      expect(record.error).toBe('Missing required param: path');
      expect(record.statusCode).toBe(400);
    });

    it('defaults market to "us" and method to "GET"', () => {
      const logger = { info: jest.fn() };
      logError(logger, 'bff-proxy', {}, new Error('fail'), 500);
      const record = JSON.parse(logger.info.mock.calls[0][0]);
      expect(record.market).toBe('us');
      expect(record.method).toBe('GET');
    });

    it('includes the HTTP method from __ow_method', () => {
      const logger = { info: jest.fn() };
      logError(logger, 'bff-proxy', { __ow_method: 'post' }, new Error('fail'), 502);
      const record = JSON.parse(logger.info.mock.calls[0][0]);
      expect(record.method).toBe('POST');
    });

    it('includes a timestamp in ISO 8601 format', () => {
      const logger = { info: jest.fn() };
      logError(logger, 'user-provider', {}, new Error('auth'), 401);
      const record = JSON.parse(logger.info.mock.calls[0][0]);
      expect(record.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('falls back to filesystem when logger.info throws', () => {
      const appendSpy = jest.spyOn(fs, 'appendFileSync').mockImplementation(() => {});
      const logger = { info: jest.fn().mockImplementation(() => { throw new Error('logger down'); }) };
      logError(logger, 'webhook', { market: 'jp' }, new Error('fail'), 500);
      expect(appendSpy).toHaveBeenCalledTimes(1);
      const [path, content] = appendSpy.mock.calls[0];
      expect(path).toBe(DATALOG_FALLBACK_PATH);
      const record = JSON.parse(content.trim());
      expect(record.level).toBe('error');
      expect(record.error).toBe('fail');
      appendSpy.mockRestore();
    });
  });

  describe('shouldLog', () => {
    it('returns true for all entry levels when DATALOG_LEVEL is "all"', () => {
      expect(shouldLog('all', 'request')).toBe(true);
      expect(shouldLog('all', 'error')).toBe(true);
    });

    it('defaults to "all" when DATALOG_LEVEL is undefined', () => {
      expect(shouldLog(undefined, 'request')).toBe(true);
      expect(shouldLog(undefined, 'error')).toBe(true);
    });

    it('only logs errors when DATALOG_LEVEL is "error"', () => {
      expect(shouldLog('error', 'request')).toBe(false);
      expect(shouldLog('error', 'error')).toBe(true);
    });

    it('disables all logging when DATALOG_LEVEL is "none"', () => {
      expect(shouldLog('none', 'request')).toBe(false);
      expect(shouldLog('none', 'error')).toBe(false);
    });
  });

  describe('DATALOG_LEVEL configuration', () => {
    it('skips request logging when DATALOG_LEVEL is "none"', () => {
      const logger = { info: jest.fn() };
      logRequest(logger, 'device-provider', { DATALOG_LEVEL: 'none' });
      expect(logger.info).not.toHaveBeenCalled();
    });

    it('skips error logging when DATALOG_LEVEL is "none"', () => {
      const logger = { info: jest.fn() };
      logError(logger, 'menu-provider', { DATALOG_LEVEL: 'none' }, new Error('fail'), 500);
      expect(logger.info).not.toHaveBeenCalled();
    });

    it('skips request logging when DATALOG_LEVEL is "error"', () => {
      const logger = { info: jest.fn() };
      logRequest(logger, 'device-provider', { DATALOG_LEVEL: 'error' });
      expect(logger.info).not.toHaveBeenCalled();
    });

    it('still logs errors when DATALOG_LEVEL is "error"', () => {
      const logger = { info: jest.fn() };
      logError(logger, 'menu-provider', { DATALOG_LEVEL: 'error' }, new Error('fail'), 500);
      expect(logger.info).toHaveBeenCalledTimes(1);
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
