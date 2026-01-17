import { Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { config } from '../config'
import { socketLogger } from '../utils/socketLogger'

export interface AuthenticatedSocket extends Socket {
  userId?: string
  userRole?: string
}

export const socketAuth = (socket: Socket, next: (err?: Error) => void) => {
  const socketId = socket.id
  
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      socketLogger.warn('socket:auth:failed', {
        socketId,
        reason: 'no_token',
      })
      return next(new Error('Authentication required'))
    }

    const jwtSecret = config.jwtSecret || process.env.JWT_SECRET
    if (!jwtSecret) {
      socketLogger.error('socket:auth:failed', {
        socketId,
        reason: 'jwt_secret_not_defined',
      })
      return next(new Error('JWT_SECRET is not defined'))
    }

    const decoded = jwt.verify(token, jwtSecret) as { id: string; role: string }
    
    // Socket 객체에 사용자 정보 저장
    ;(socket as AuthenticatedSocket).userId = decoded.id
    ;(socket as AuthenticatedSocket).userRole = decoded.role
    
    socketLogger.info('socket:auth:success', {
      userId: decoded.id,
      socketId,
    })
    next()
  } catch (error) {
    let reason = 'unknown'
    if (error instanceof jwt.JsonWebTokenError) {
      reason = 'invalid_token'
      next(new Error('Invalid token'))
    } else if (error instanceof jwt.TokenExpiredError) {
      reason = 'token_expired'
      next(new Error('Token expired'))
    } else {
      reason = 'authentication_failed'
      next(new Error('Authentication failed'))
    }
    
    socketLogger.error('socket:auth:failed', {
      socketId,
      reason,
    })
  }
}
