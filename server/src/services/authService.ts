import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { User } from '../models/User'
import { IUser, UserRole } from '../types'
import { AppError } from '../middleware/errorHandler'
import { config } from '../config'

interface RegisterData {
  id: string // 사용자 ID
  name: string
  nickname: string
  password: string
  class?: number // 수강 반
}

interface LoginData {
  id: string // ID로 로그인
  password: string
}

// 회원가입 (학생만 가능)
export const register = async (data: RegisterData): Promise<IUser> => {
  // ID 중복 확인
  const existingUserById = await User.findOne({ id: data.id })
  if (existingUserById) {
    throw new AppError('이미 사용 중인 ID입니다.', 400)
  }

  // 닉네임 중복 확인
  const existingUserByNickname = await User.findOne({ nickname: data.nickname })
  if (existingUserByNickname) {
    throw new AppError('이미 사용 중인 닉네임입니다.', 400)
  }

  // 비밀번호 해시
  const saltRounds = 10
  const hashedPassword = await bcrypt.hash(data.password, saltRounds)

  // 사용자 데이터 생성 (학생만)
  const userData: any = {
    id: data.id,
    name: data.name,
    nickname: data.nickname,
    password: hashedPassword,
    role: 'student', // 항상 학생
  }

  // 수강 반 추가
  if (data.class) {
    userData.class = data.class
  }

  const user = new User(userData)
  await user.save()

  // password 제외하고 반환
  const userObject = user.toObject()
  delete userObject.password
  return userObject as IUser
}

// 로그인
export const login = async (data: LoginData): Promise<{ user: IUser; token: string }> => {
  // ID로 사용자 찾기 (password 포함)
  const user = await User.findOne({ id: data.id }).select('+password')
  if (!user) {
    throw new AppError('ID 또는 비밀번호가 올바르지 않습니다.', 401)
  }

  // 비밀번호 확인
  const isPasswordValid = await bcrypt.compare(data.password, user.password)
  if (!isPasswordValid) {
    throw new AppError('ID 또는 비밀번호가 올바르지 않습니다.', 401)
  }

  // JWT 토큰 생성
  const token = generateToken(user._id.toString(), user.role)

  // password 제외하고 반환
  const userObject = user.toObject()
  delete userObject.password

  return {
    user: userObject as IUser,
    token,
  }
}

// JWT 토큰 생성
export const generateToken = (userId: string, role: UserRole): string => {
  if (!config.jwtSecret) {
    throw new Error('JWT_SECRET is not defined')
  }

  return jwt.sign(
    { id: userId, role },
    config.jwtSecret,
    { expiresIn: config.jwtExpire }
  )
}

// 사용자 조회 (토큰에서)
export const getCurrentUser = async (userId: string): Promise<IUser | null> => {
  try {
    // userId가 MongoDB ObjectId 형식인지 확인
    const user = await User.findById(userId)
    if (!user) {
      // ObjectId로 찾지 못한 경우, id 필드로도 시도
      const userById = await User.findOne({ id: userId })
      if (!userById) {
        return null
      }
      const userObject = userById.toObject()
      delete userObject.password
      return userObject as IUser
    }

    // password 제외하고 반환
    const userObject = user.toObject()
    delete userObject.password
    return userObject as IUser
  } catch (error) {
    console.error('getCurrentUser error:', error)
    return null
  }
}
