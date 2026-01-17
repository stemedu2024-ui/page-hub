/**
 * Socket.IO 이벤트 로깅 유틸리티
 * 개발 환경: 모든 로그 출력
 * 프로덕션 환경: info + error만 출력
 */

type LogLevel = 'info' | 'warn' | 'error'

interface LogData {
  level: LogLevel
  event: string
  userId?: string
  socketId?: string
  reason?: string
  timestamp: string
  [key: string]: any
}

const isDev = process.env.NODE_ENV === 'development'

const shouldLog = (level: LogLevel): boolean => {
  if (isDev) return true // 개발 환경: 모든 로그
  return level === 'info' || level === 'error' // 프로덕션: info + error만
}

const formatLog = (data: LogData): string => {
  const parts: string[] = []
  
  // 레벨 아이콘
  const icons: Record<LogLevel, string> = {
    info: '✅',
    warn: '⚠️',
    error: '❌',
  }
  parts.push(icons[data.level] || '📌')
  
  // 이벤트 이름
  parts.push(`[${data.event}]`)
  
  // 사용자 ID
  if (data.userId) {
    parts.push(`user:${data.userId}`)
  }
  
  // 소켓 ID (개발 환경에서만)
  if (isDev && data.socketId) {
    parts.push(`socket:${data.socketId.substring(0, 8)}...`)
  }
  
  // 이유 (있는 경우)
  if (data.reason) {
    parts.push(`reason:${data.reason}`)
  }
  
  // 타임스탬프 (개발 환경에서만)
  if (isDev && data.timestamp) {
    parts.push(`(${data.timestamp})`)
  }
  
  return parts.join(' ')
}

export const socketLogger = {
  info: (event: string, data: Partial<LogData> = {}) => {
    if (!shouldLog('info')) return
    
    const logData: LogData = {
      level: 'info',
      event,
      timestamp: new Date().toISOString(),
      ...data,
    }
    
    console.log(formatLog(logData))
  },
  
  warn: (event: string, data: Partial<LogData> = {}) => {
    if (!shouldLog('warn')) return
    
    const logData: LogData = {
      level: 'warn',
      event,
      timestamp: new Date().toISOString(),
      ...data,
    }
    
    console.warn(formatLog(logData))
  },
  
  error: (event: string, data: Partial<LogData> = {}) => {
    if (!shouldLog('error')) return
    
    const logData: LogData = {
      level: 'error',
      event,
      timestamp: new Date().toISOString(),
      ...data,
    }
    
    console.error(formatLog(logData))
  },
}
