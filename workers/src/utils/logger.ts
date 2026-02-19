/**
 * Structured Logger Utility
 * Requirements: 14.1, 14.5, 14.6
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
}

/**
 * Sensitive field patterns to mask in logs
 */
const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /key/i,
  /hash/i,
  /iv/i,
  /credit[_-]?card/i,
  /card[_-]?number/i,
  /cvv/i,
  /api[_-]?key/i,
];

/**
 * Mask sensitive data in objects
 */
function maskSensitiveData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    // Mask credit card numbers (16 digits with optional separators, but not UUIDs)
    // Only mask if it looks like a credit card (no letters, only digits and separators)
    if (/^[\d\s-]+$/.test(data)) {
      return data.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '****-****-****-****')
                 .replace(/\b\d{16}\b/g, '****-****-****-****');
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => maskSensitiveData(item));
  }

  if (typeof data === 'object') {
    const masked: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Check if key matches sensitive patterns
      const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
      
      if (isSensitive) {
        masked[key] = '***MASKED***';
      } else if (typeof value === 'object') {
        masked[key] = maskSensitiveData(value);
      } else if (typeof value === 'string') {
        // Also mask credit cards in string values
        masked[key] = maskSensitiveData(value);
      } else {
        masked[key] = value;
      }
    }
    
    return masked;
  }

  return data;
}

/**
 * Logger class with structured logging and sensitive data masking
 */
export class Logger {
  constructor(private minLevel: LogLevel = LogLevel.INFO) {}

  /**
   * Log a message with the specified level
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevelIndex = levels.indexOf(this.minLevel);
    const messageLevelIndex = levels.indexOf(level);

    // Only log if message level is >= min level
    if (messageLevelIndex < currentLevelIndex) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: context ? maskSensitiveData(context) : undefined,
    };

    // Output to console (Cloudflare Workers will capture this)
    const logMethod = level === LogLevel.ERROR ? console.error : 
                     level === LogLevel.WARN ? console.warn : 
                     console.log;
    
    logMethod(JSON.stringify(entry));
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context);
  }
}

/**
 * Create a logger instance
 */
export function createLogger(minLevel: LogLevel = LogLevel.INFO): Logger {
  return new Logger(minLevel);
}
