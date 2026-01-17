import api from './api'
import { User } from '../types'

interface RegisterData {
  id: string
  name: string
  nickname: string
  password: string
  class?: number // 수강 반
}

interface LoginData {
  id: string
  password: string
}

interface RegisterResponse {
  status: string
  message: string
  user: User
}

interface LoginResponse {
  status: string
  message: string
  token: string
  user: User
}

interface MeResponse {
  status: string
  user: User
}

// 회원가입
export const register = async (data: RegisterData): Promise<RegisterResponse> => {
  const response = await api.post<RegisterResponse>('/auth/register', data)
  return response.data
}

// 로그인
export const login = async (data: LoginData): Promise<LoginResponse> => {
  try {
    console.log('🟡 API 호출 시작 - 로그인:', { id: data.id, timestamp: new Date().toISOString() })
    const response = await api.post<LoginResponse>('/auth/login', data)
    console.log('🟢 API 응답 성공:', response.data)
    return response.data
  } catch (error: any) {
    console.error('🔴 API 에러 발생:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
      },
    })
    throw error
  }
}

// 현재 사용자 조회
export const getMe = async (): Promise<MeResponse> => {
  const response = await api.get<MeResponse>('/auth/me')
  return response.data
}
