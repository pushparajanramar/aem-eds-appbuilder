/**
 * Tests for shared/datalog.js
 */

import { logRequest } from '../src/shared/datalog.js';

describe('datalog', () => {
  it('logs a structured JSON record to console', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const req = new Request('https://example.com/menu-provider?market=us');

    logRequest('menu-provider', req, 'us');

    expect(spy).toHaveBeenCalledTimes(1);
    const record = JSON.parse(spy.mock.calls[0][0]);
    expect(record.type).toBe('datalog');
    expect(record.action).toBe('menu-provider');
    expect(record.method).toBe('GET');
    expect(record.market).toBe('us');
    expect(record.timestamp).toBeDefined();

    spy.mockRestore();
  });
});
