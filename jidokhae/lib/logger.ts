/* eslint-disable no-console */
// 프로덕션 안전 로깅 유틸리티
// 이 파일은 의도적으로 console을 사용합니다

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  context?: Record<string, unknown>
  timestamp: string
}

const isDev = process.env.NODE_ENV === 'development'

function formatLog(entry: LogEntry): string {
  const { level, message, context, timestamp } = entry
  const contextStr = context ? ` | ${JSON.stringify(context)}` : ''
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
}

function createLogEntry(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>
): LogEntry {
  return {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
  }
}

export const logger = {
  debug(message: string, context?: Record<string, unknown>) {
    if (isDev) {
      const entry = createLogEntry('debug', message, context)
      console.log(formatLog(entry))
    }
  },

  info(message: string, context?: Record<string, unknown>) {
    const entry = createLogEntry('info', message, context)
    if (isDev) {
      console.info(formatLog(entry))
    }
    // TODO: 프로덕션에서는 외부 로깅 서비스로 전송
  },

  warn(message: string, context?: Record<string, unknown>) {
    const entry = createLogEntry('warn', message, context)
    console.warn(formatLog(entry))
    // TODO: 프로덕션에서는 외부 로깅 서비스로 전송
  },

  error(message: string, error?: unknown, context?: Record<string, unknown>) {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: isDev ? error.stack : undefined,
      } : String(error),
    }
    const entry = createLogEntry('error', message, errorContext)
    console.error(formatLog(entry))
    // TODO: 프로덕션에서는 외부 로깅 서비스로 전송 (Sentry 등)
  },
}

export default logger
