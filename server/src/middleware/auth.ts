import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AppError } from './errorHandler'
import { config } from '../config'

export interface AuthRequest extends Request {
  user?: {
    id: string
    role: string
  }
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    console.log('🔍 authenticate: 요청 헤더 확인', {
      hasAuthHeader: !!authHeader,
      authHeader: authHeader ? authHeader.substring(0, 20) + '...' : null,
    })

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('🔴 authenticate: Authorization 헤더 없음 또는 형식 오류')
      throw new AppError('Authentication required', 401)
    }

    const token = authHeader.split(' ')[1]
    console.log('🔍 authenticate: 토큰 추출', {
      hasToken: !!token,
      tokenLength: token?.length,
      tokenPrefix: token?.substring(0, 20) + '...',
    })

    if (!token) {
      console.log('🔴 authenticate: 토큰 없음')
      throw new AppError('Authentication required', 401)
    }

    // config에서 JWT_SECRET 가져오기 (토큰 생성 시와 동일한 secret 사용)
    const jwtSecret = config.jwtSecret || process.env.JWT_SECRET
    
    if (!jwtSecret) {
      console.error('🔴 authenticate: JWT_SECRET이 정의되지 않음')
      throw new Error('JWT_SECRET is not defined')
    }

    console.log('🔍 authenticate: 토큰 검증 시도', {
      hasSecret: !!jwtSecret,
      secretLength: jwtSecret.length,
      usingConfig: !!config.jwtSecret,
      usingEnv: !!process.env.JWT_SECRET,
    })

    const decoded = jwt.verify(token, jwtSecret) as { id: string; role: string }
    console.log('✅ authenticate: 토큰 검증 성공', { 
      id: decoded.id, 
      role: decoded.role,
      decodedKeys: Object.keys(decoded),
    })
    req.user = decoded
    next()
  } catch (error) {
    console.error('❌ authenticate: 토큰 검증 실패', {
      error,
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : 'Unknown',
      isJWTError: error instanceof jwt.JsonWebTokenError,
      isExpiredError: error instanceof jwt.TokenExpiredError,
    })
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401))
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expired', 401))
    } else {
      next(error)
    }
  }
}

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401))
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403))
    }

    next()
  }
}
