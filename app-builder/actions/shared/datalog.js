/**
 * Datalog — Structured request logging for all App Builder actions.
 *
 * Every incoming request is recorded to the datalog so that engineers
 * have a full audit trail of all traffic across actions.
 * If the datalog (logger) is unavailable, the record is written to the
 * local filesystem at DATALOG_FALLBACK_PATH as a newline-delimited JSON file.
 *
 * Error and response events are also recorded when DATALOG_LEVEL is set to
 * 'all' (default) or 'error'.  Set DATALOG_LEVEL to 'none' to disable
 * datalog entries entirely.
 */

const fs = require('fs');

const DATALOG_FALLBACK_PATH = '/tmp/datalog.log';

/**
 * Write a structured JSON record to the datalog.
 * Falls back to filesystem when the logger throws.
 *
 * @param {object} logger - Core.Logger instance
 * @param {object} record - Structured log record
 */
function writeRecord(logger, record) {
  const line = JSON.stringify(record);
  try {
    logger.info(line);
  } catch {
    fs.appendFileSync(DATALOG_FALLBACK_PATH, line + '\n', 'utf8');
  }
}

/**
 * Check whether a given level should be recorded based on the
 * configured DATALOG_LEVEL.
 *
 * Levels hierarchy: all > error > none
 *   - 'all'   (default) — record requests, errors and responses
 *   - 'error' — record only error entries
 *   - 'none'  — disable datalog entirely
 *
 * @param {string} configuredLevel - Value of params.DATALOG_LEVEL
 * @param {string} entryLevel      - 'request' | 'error' | 'response'
 * @returns {boolean}
 */
function shouldLog(configuredLevel, entryLevel) {
  const level = (configuredLevel || 'all').toLowerCase();
  if (level === 'none') return false;
  if (level === 'error') return entryLevel === 'error';
  return true; // 'all' or any other value → log everything
}

/**
 * Log a structured request record to the datalog.
 * Falls back to filesystem logging if the datalog logger throws.
 *
 * @param {object} logger     - Core.Logger instance for the action
 * @param {string} action     - Action name (e.g. 'device-provider')
 * @param {object} params     - Incoming action params from Adobe I/O Runtime
 */
function logRequest(logger, action, params) {
  if (!shouldLog(params.DATALOG_LEVEL, 'request')) return;

  const record = {
    type: 'datalog',
    level: 'info',
    action,
    method: (params.__ow_method || 'GET').toUpperCase(),
    market: params.market || 'us',
    timestamp: new Date().toISOString(),
  };
  writeRecord(logger, record);
}

/**
 * Log a structured error record to the datalog.
 * Called from catch blocks so that errors are captured in the audit trail.
 *
 * @param {object} logger     - Core.Logger instance for the action
 * @param {string} action     - Action name (e.g. 'menu-provider')
 * @param {object} params     - Incoming action params from Adobe I/O Runtime
 * @param {Error|string} error - The caught error
 * @param {number} statusCode  - HTTP status code returned to the caller
 */
function logError(logger, action, params, error, statusCode) {
  if (!shouldLog(params.DATALOG_LEVEL, 'error')) return;

  const record = {
    type: 'datalog',
    level: 'error',
    action,
    method: (params.__ow_method || 'GET').toUpperCase(),
    market: params.market || 'us',
    statusCode,
    error: error instanceof Error ? error.message : String(error),
    timestamp: new Date().toISOString(),
  };
  writeRecord(logger, record);
}

module.exports = { logRequest, logError, shouldLog, DATALOG_FALLBACK_PATH };
