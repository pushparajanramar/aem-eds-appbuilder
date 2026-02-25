/**
 * Datalog — Structured request logging for all App Builder actions.
 *
 * Every incoming request is recorded to the datalog so that engineers
 * have a full audit trail of all traffic across actions.
 * If the datalog (logger) is unavailable, the record is written to the
 * local filesystem at DATALOG_FALLBACK_PATH as a newline-delimited JSON file.
 */

const fs = require('fs');

const DATALOG_FALLBACK_PATH = '/tmp/datalog.log';

/**
 * Log a structured request record to the datalog.
 * Falls back to filesystem logging if the datalog logger throws.
 *
 * @param {object} logger     - Core.Logger instance for the action
 * @param {string} action     - Action name (e.g. 'device-provider')
 * @param {object} params     - Incoming action params from Adobe I/O Runtime
 */
function logRequest(logger, action, params) {
  const record = {
    type: 'datalog',
    action,
    method: (params.__ow_method || 'GET').toUpperCase(),
    market: params.market || 'us',
    timestamp: new Date().toISOString(),
  };
  const line = JSON.stringify(record);
  try {
    logger.info(line);
  } catch {
    fs.appendFileSync(DATALOG_FALLBACK_PATH, line + '\n', 'utf8');
  }
}

module.exports = { logRequest, DATALOG_FALLBACK_PATH };
