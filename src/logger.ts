/**
 * Logger system usage:
 * 
 * This file uses the Logger utility to print prefixed logs for tracing/debugging.
 * Logging is automatically disabled in production (when `env.logger !== 'dev'`).
 *
 * Usage:
 * 
 *   const logger = new Logger('services/auth')
 *   logger.info('logout', 'User requested logout')
 *
 * For cleaner usage inside functions:
 * 
 *   export const logout = logger.withCaller(function logout(log) {
 *     log.info('User requested logout')
 *     ...
 *   })
 * 
 * Logs will appear in the format:
 *   [services/auth:logout] User requested logout
 */
type LoggerLevel = 'log' | 'info' | 'warn' | 'error' | 'debug'

type LogMethod = (...args: unknown[]) => void

type BoundLogger = {
  [K in LoggerLevel]: LogMethod
}

type LoggerCallback<T extends any[] = any[]> = (logger: BoundLogger, ...args: T) => any

export class Logger {
  prefix: string

  constructor(prefix: string) {
    this.prefix = prefix
  }

  private _format(caller: string, ...args: unknown[]): [string, ...unknown[]] {
    const label = caller ? `${this.prefix}:${caller}` : this.prefix
    return [`[webciel-plugin:${label}]`, ...args]
  }

  log(caller: string, ...args: unknown[]): void {
    console.log(...this._format(caller, ...args))
  }

  info(caller: string, ...args: unknown[]): void {
    console.info(...this._format(caller, ...args))
  }

  warn(caller: string, ...args: unknown[]): void {
    console.warn(...this._format(caller, ...args))
  }

  error(caller: string, ...args: unknown[]): void {
    console.error(...this._format(caller, ...args))
  }

  debug(caller: string, ...args: unknown[]): void {
    console.debug(...this._format(caller, ...args))
  }

  withCaller<T extends any[]>(callback: LoggerCallback<T>): (...args: T) => any {
    if (typeof callback !== 'function') {
      throw new Error('withCaller expects a named function')
    }

    const name = callback.name || '(anonymous)'
    const logger = this

    return (...args: T) => {
      const bound: BoundLogger = {
        log: (...a) => logger.log(name, ...a),
        info: (...a) => logger.info(name, ...a),
        warn: (...a) => logger.warn(name, ...a),
        error: (...a) => logger.error(name, ...a),
        debug: (...a) => logger.debug(name, ...a),
      }

      return callback(bound, ...args)
    }
  }
}
