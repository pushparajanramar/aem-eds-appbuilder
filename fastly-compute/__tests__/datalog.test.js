/**
 * Tests for shared/datalog.js
 */

import { jest } from '@jest/globals';
import { logRequest, logError } from '../src/shared/datalog.js';

describe('datalog', () => {
  describe('logRequest', () => {
    it('logs a structured JSON record to console', () => {
      const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const req = new Request('https://example.com/menu-provider?market=us');

      logRequest('menu-provider', req, 'us');

      expect(spy).toHaveBeenCalledTimes(1);
      const record = JSON.parse(spy.mock.calls[0][0]);
      expect(record.type).toBe('datalog');
      expect(record.level).toBe('info');
      expect(record.action).toBe('menu-provider');
      expect(record.method).toBe('GET');
      expect(record.market).toBe('us');
      expect(record.timestamp).toBeDefined();

      spy.mockRestore();
    });
  });

  describe('logError', () => {
    it('logs a structured error record to console', () => {
      const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const req = new Request('https://example.com/menu-provider?market=us');

      logError('menu-provider', req, 'us', new Error('upstream failed'), 500);

      expect(spy).toHaveBeenCalledTimes(1);
      const record = JSON.parse(spy.mock.calls[0][0]);
      expect(record.type).toBe('datalog');
      expect(record.level).toBe('error');
      expect(record.action).toBe('menu-provider');
      expect(record.method).toBe('GET');
      expect(record.market).toBe('us');
      expect(record.statusCode).toBe(500);
      expect(record.error).toBe('upstream failed');
      expect(record.url).toBe('https://example.com/menu-provider?market=us');
      expect(record.timestamp).toBeDefined();

      spy.mockRestore();
    });

    it('handles string errors', () => {
      const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const req = new Request('https://example.com/webhook', { method: 'POST' });

      logError('webhook', req, 'uk', 'Missing required param: path', 400);

      const record = JSON.parse(spy.mock.calls[0][0]);
      expect(record.error).toBe('Missing required param: path');
      expect(record.statusCode).toBe(400);
      expect(record.method).toBe('POST');
      expect(record.market).toBe('uk');

      spy.mockRestore();
    });

    it('defaults market to "us"', () => {
      const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const req = new Request('https://example.com/bff-proxy');

      logError('bff-proxy', req, undefined, new Error('auth failed'), 401);

      const record = JSON.parse(spy.mock.calls[0][0]);
      expect(record.market).toBe('us');

      spy.mockRestore();
    });
  });
});
