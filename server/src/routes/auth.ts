import { Router } from 'express'
import { registerUser, loginUser, getMe } from '../controllers/authController'
import { authenticate } from '../middleware/auth'

const router = Router()

// 회원가입
router.post('/register', registerUser)

// 로그인
router.post('/login', loginUser)

// 현재 사용자 조회 (인증 필요)
router.get('/me', authenticate, getMe)

export default router
