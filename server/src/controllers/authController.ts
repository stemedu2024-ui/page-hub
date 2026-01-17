import { Request, Response, NextFunction } from 'express'
import { register, login, getCurrentUser } from '../services/authService'
import { validateRegisterData, validateLoginData } from '../utils/validation'
import { AuthRequest } from '../middleware/auth'

// 회원가입
export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = req.body

    // 입력 검증
    validateRegisterData({
      id: data.id,
      name: data.name,
      nickname: data.nickname,
      password: data.password,
    })

    // 회원가입 처리 (학생만 가능)
    const user = await register({
      id: data.id,
      name: data.name,
      nickname: data.nickname,
      password: data.password,
      class: data.class,
    })

    res.status(201).json({
      status: 'success',
      message: '회원가입이 완료되었습니다.',
      user,
    })
  } catch (error) {
    next(error)
  }
}

// 로그인
export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = req.body

    // 입력 검증
    validateLoginData({
      id: data.id,
      password: data.password,
    })

    // 로그인 처리
    const result = await login({
      id: data.id,
      password: data.password,
    })

    res.status(200).json({
      status: 'success',
      message: '로그인되었습니다.',
      token: result.token,
      user: result.user,
    })
  } catch (error) {
    next(error)
  }
}

// 현재 사용자 조회
export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      console.log('🔴 getMe: req.user 없음')
      res.status(401).json({
        status: 'error',
        message: '인증이 필요합니다.',
      })
      return
    }

    console.log('🔍 getMe: 사용자 조회 시작', { userId: req.user.id })
    const user = await getCurrentUser(req.user.id)
    if (!user) {
      console.log('🔴 getMe: 사용자를 찾을 수 없음', { userId: req.user.id })
      res.status(404).json({
        status: 'error',
        message: '사용자를 찾을 수 없습니다.',
      })
      return
    }

    console.log('✅ getMe: 사용자 조회 성공', { userId: user._id, nickname: user.nickname })
    res.status(200).json({
      status: 'success',
      user,
    })
  } catch (error) {
    console.error('❌ getMe: 에러 발생', error)
    next(error)
  }
}
