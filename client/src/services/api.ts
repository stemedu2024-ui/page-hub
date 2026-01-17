import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 요청 인터셉터: 토큰 자동 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    console.log('📤 API 요청:', {
      url: config.url,
      method: config.method,
      hasToken: !!token,
      tokenLength: token?.length,
      tokenPrefix: token ? token.substring(0, 20) + '...' : null,
    })
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('✅ Authorization 헤더 추가됨')
    } else {
      console.warn('⚠️ 토큰이 없어서 Authorization 헤더를 추가하지 않음')
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 로그를 localStorage에 저장하는 헬퍼 함수
const saveErrorLog = (error: any) => {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.response?.data?.message,
      data: error.response?.data,
      pathname: window.location.pathname,
    }
    
    const existingLogs = JSON.parse(localStorage.getItem('apiErrorLogs') || '[]')
    existingLogs.push(logEntry)
    // 최근 20개만 유지
    const recentLogs = existingLogs.slice(-20)
    localStorage.setItem('apiErrorLogs', JSON.stringify(recentLogs))
    
    console.group('🔴 401 에러 상세 정보 (로그는 localStorage에 저장됨)')
    console.log('URL:', logEntry.url)
    console.log('Method:', logEntry.method)
    console.log('Status:', logEntry.status)
    console.log('Message:', logEntry.message)
    console.log('Response Data:', logEntry.data)
    console.log('Current Path:', logEntry.pathname)
    console.log('전체 로그 확인: localStorage.getItem("apiErrorLogs")')
    console.groupEnd()
  } catch (e) {
    console.error('로그 저장 실패:', e)
  }
}

// 응답 인터셉터: 에러 처리
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // 로그인 페이지가 아닌 경우에만 리다이렉트
      const currentPath = window.location.pathname
      // 로그인/회원가입 요청 자체가 401인 경우는 리다이렉트하지 않음
      const isAuthRequest = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register')
      
      if (!isAuthRequest && currentPath !== '/login' && currentPath !== '/register') {
        // 에러 로그 저장
        saveErrorLog(error)
        
        // authStore의 logout 호출하여 상태 동기화
        try {
          const { useAuthStore } = await import('../store/authStore')
          useAuthStore.getState().logout()
        } catch (e) {
          console.error('로그아웃 처리 실패:', e)
        }
        
        // 리다이렉트를 충분히 지연시켜서 로그를 확인할 수 있도록 함
        // 사용자가 로그를 확인할 시간을 주기 위해 5초 대기
        console.warn('⚠️ 5초 후 로그인 페이지로 이동합니다. 콘솔 로그를 확인하세요.')
        console.warn('⚠️ 로그는 localStorage에 저장되었습니다. 확인: localStorage.getItem("apiErrorLogs")')
        
        setTimeout(() => {
          window.location.href = '/login'
        }, 5000) // 5초 지연
      } else {
        console.log('⚠️ 401 에러이지만 리다이렉트하지 않음:', {
          url: error.config?.url,
          currentPath,
          isAuthRequest,
        })
      }
    }
    return Promise.reject(error)
  }
)

export default api
