import { create } from 'zustand'
import { User } from '../types'
import * as authService from '../services/authService'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  token: string | null
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setIsAuthenticated: (isAuthenticated: boolean) => void
  register: (data: {
    id: string
    name: string
    nickname: string
    password: string
    class?: number
  }) => Promise<void>
  login: (id: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  token: localStorage.getItem('token'),

  setUser: (user) => set({ user }),
  setToken: (token) => {
    set({ token })
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  },
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

  register: async (data) => {
    try {
      const response = await authService.register(data)
      set({
        user: response.user,
        isAuthenticated: true,
      })
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '회원가입에 실패했습니다.')
    }
  },

  login: async (id, password) => {
    try {
      console.log('🔵 authStore login 호출:', { id, timestamp: new Date().toISOString() })
      const response = await authService.login({ id, password })
      console.log('🟢 authService 응답:', response)
      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
      })
      localStorage.setItem('token', response.token)
      
      // Socket.IO 연결
      const { socketService } = await import('../services/socketService')
      socketService.connect(response.token)
    } catch (error: any) {
      console.error('🔴 authStore login 에러:', {
        error,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
      })
      const errorMessage = error.response?.data?.message || error.message || '로그인에 실패했습니다.'
      throw error // 원본 에러를 그대로 throw하여 상세 정보 유지
    }
  },

  logout: () => {
    // Socket.IO 연결 해제
    import('../services/socketService').then(({ socketService }) => {
      socketService.disconnect()
    })
    
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    })
    localStorage.removeItem('token')
  },

  checkAuth: async () => {
    const token = get().token || localStorage.getItem('token')
    console.log('🔍 checkAuth 시작:', { hasToken: !!token, token: token?.substring(0, 20) + '...' })
    
    if (!token) {
      console.log('❌ checkAuth: 토큰 없음')
      set({ isAuthenticated: false, user: null })
      return
    }

    try {
      console.log('📡 checkAuth: API 호출 시작')
      const response = await authService.getMe()
      console.log('✅ checkAuth: API 응답 성공', response)
      set({
        user: response.user,
        token,
        isAuthenticated: true,
      })
      console.log('✅ checkAuth: 상태 업데이트 완료')
      
      // Socket.IO 연결 (토큰이 있고 사용자가 있으면)
      if (token && response.user) {
        const { socketService } = await import('../services/socketService')
        socketService.connect(token)
      }
    } catch (error: any) {
      console.error('❌ checkAuth: API 호출 실패', {
        error,
        response: error.response?.data,
        status: error.response?.status,
      })
      set({
        user: null,
        token: null,
        isAuthenticated: false,
      })
      localStorage.removeItem('token')
    }
  },
}))
