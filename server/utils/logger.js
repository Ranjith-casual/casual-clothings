// Logger utility to replace console logs
// Helps standardize logging across the application

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  VERBOSE: 4
};

// Configure based on environment
const currentLogLevel = process.env.LOG_LEVEL 
  ? LOG_LEVELS[process.env.LOG_LEVEL]
  : (process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG);

/**
 * Logger utility with support for log levels
 */
export class Logger {
  /**
   * Log error messages (always displayed)
   * @param {string} context - The context/module where the error occurred
   * @param {string} message - The error message
   * @param {Error|Object} [error] - Optional error object or details
   */
  static error(context, message, error = null) {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      console.error(`❌ ERROR [${context}]: ${message}`);
      if (error) {
        if (error instanceof Error) {
          console.error(error.stack || error.message);
        } else {
          console.error(error);
        }
      }
    }
  }

  /**
   * Log warning messages
   * @param {string} context - The context/module where the warning occurred
   * @param {string} message - The warning message
   * @param {Object} [details] - Optional warning details
   */
  static warn(context, message, details = null) {
    if (currentLogLevel >= LOG_LEVELS.WARN) {
      console.warn(`⚠️ WARN [${context}]: ${message}`);
      if (details) {
        console.warn(details);
      }
    }
  }

  /**
   * Log informational messages
   * @param {string} context - The context/module
   * @param {string} message - The info message
   * @param {Object} [details] - Optional details
   */
  static info(context, message, details = null) {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      console.log(`ℹ️ INFO [${context}]: ${message}`);
      if (details) {
        console.log(details);
      }
    }
  }

  /**
   * Log debug messages (not shown in production by default)
   * @param {string} context - The context/module
   * @param {string} message - The debug message
   * @param {Object} [details] - Optional debug details
   */
  static debug(context, message, details = null) {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      console.log(`🔍 DEBUG [${context}]: ${message}`);
      if (details) {
        console.log(details);
      }
    }
  }

  /**
   * Log verbose messages (most detailed level)
   * @param {string} context - The context/module
   * @param {string} message - The verbose message
   * @param {Object} [details] - Optional verbose details
   */
  static verbose(context, message, details = null) {
    if (currentLogLevel >= LOG_LEVELS.VERBOSE) {
      console.log(`🔬 VERBOSE [${context}]: ${message}`);
      if (details) {
        console.log(details);
      }
    }
  }
}

export default Logger;
