import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useEffect, useState } from 'react'

interface PrivateRouteProps {
  children: React.ReactNode
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { isAuthenticated, checkAuth, token } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('token')
      
      console.log('🔐 PrivateRoute 마운트:', {
        storedToken: !!storedToken,
        isAuthenticated,
        token,
        pathname: window.location.pathname,
      })
      
      // 토큰이 있지만 인증 상태가 아닌 경우
      if (storedToken && !isAuthenticated) {
        console.log('🔐 PrivateRoute: 토큰 발견, 인증 확인 중...')
        try {
          await checkAuth()
          // checkAuth 후 상태 다시 확인
          const updatedState = useAuthStore.getState()
          console.log('✅ PrivateRoute: 인증 확인 완료, 상태:', {
            isAuthenticated: updatedState.isAuthenticated,
            hasUser: !!updatedState.user,
          })
        } catch (error: any) {
          console.error('❌ PrivateRoute: 인증 확인 실패', {
            error,
            message: error.response?.data?.message,
            status: error.response?.status,
            responseData: error.response?.data,
          })
          // 인증 실패 시 상태 초기화하지 않고 에러만 로그
          // 실제 리다이렉트는 isAuthenticated가 false일 때 자동으로 처리됨
        }
      } else if (!storedToken) {
        console.log('🚫 PrivateRoute: 토큰 없음')
        // 토큰이 없으면 인증 상태도 false로 설정
        if (isAuthenticated) {
          useAuthStore.getState().logout()
        }
      } else if (isAuthenticated) {
        console.log('✅ PrivateRoute: 이미 인증됨')
      }
      
      setIsChecking(false)
    }

    verifyAuth()
  }, []) // 마운트 시 한 번만 실행
  
  // isAuthenticated가 변경될 때마다 로그 출력
  useEffect(() => {
    console.log('🔄 PrivateRoute 상태 변경:', {
      isAuthenticated,
      hasToken: !!localStorage.getItem('token'),
      pathname: window.location.pathname,
    })
  }, [isAuthenticated])

  // 인증 확인 중이면 로딩 표시
  if (isChecking) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div>인증 확인 중...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    console.log('🚫 PrivateRoute: 인증되지 않음, 로그인 페이지로 리다이렉트')
    return <Navigate to="/login" replace />
  }

  console.log('✅ PrivateRoute: 인증됨, 콘텐츠 표시')
  return <>{children}</>
}

export default PrivateRoute
