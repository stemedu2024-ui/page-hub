import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'
import { API_ENDPOINTS } from '../constants'

export const useAuth = () => {
  const { user, setUser, isAuthenticated, setIsAuthenticated } = useAuthStore()

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (token && !user) {
        try {
          const response = await api.get(API_ENDPOINTS.AUTH.ME)
          setUser(response.data.user)
          setIsAuthenticated(true)
        } catch (error) {
          localStorage.removeItem('token')
          setIsAuthenticated(false)
        }
      }
    }
    checkAuth()
  }, [user, setUser, setIsAuthenticated])

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, { email, password })
      localStorage.setItem('token', response.data.token)
      setUser(response.data.user)
      setIsAuthenticated(true)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || '로그인 실패' }
    }
  }

  const logout = async () => {
    try {
      await api.post(API_ENDPOINTS.AUTH.LOGOUT)
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      setUser(null)
      setIsAuthenticated(false)
    }
  }

  return {
    user,
    isAuthenticated,
    login,
    logout,
  }
}
