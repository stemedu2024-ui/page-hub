import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '../components/InputForm'
import Button from '../components/Button'
import Card from '../components/Card'
import { useAuthStore } from '../store/authStore'

const Login = () => {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // 로그를 localStorage에 저장하여 새로고침 후에도 확인 가능하도록
    const logError = (message: string, data?: any) => {
      console.error(message, data)
      const timestamp = new Date().toISOString()
      const logEntry = { timestamp, message, data }
      try {
        const existingLogs = JSON.parse(localStorage.getItem('loginLogs') || '[]')
        existingLogs.push(logEntry)
        // 최근 10개만 유지
        const recentLogs = existingLogs.slice(-10)
        localStorage.setItem('loginLogs', JSON.stringify(recentLogs))
      } catch (e) {
        console.error('로그 저장 실패:', e)
      }
    }

    try {
      logError('로그인 시도 시작', { id, timestamp: new Date().toISOString() })
      await login(id, password)
      logError('로그인 성공', { id, timestamp: new Date().toISOString() })
      
      // 상태 업데이트 확인
      const state = useAuthStore.getState()
      console.log('✅ 로그인 후 상태 확인:', { 
        user: state.user, 
        isAuthenticated: state.isAuthenticated, 
        hasToken: !!localStorage.getItem('token'),
        token: localStorage.getItem('token')?.substring(0, 20) + '...'
      })
      
      // 성공 로그는 제거
      localStorage.removeItem('loginLogs')
      
      // 상태가 제대로 업데이트될 때까지 약간 대기
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // 다시 한 번 상태 확인
      const finalState = useAuthStore.getState()
      console.log('✅ 로그인 후 최종 상태 확인:', { 
        user: finalState.user, 
        isAuthenticated: finalState.isAuthenticated, 
        hasToken: !!localStorage.getItem('token')
      })
      
      // 홈으로 이동 (replace: true로 히스토리 스택에 로그인 페이지 남기지 않음)
      console.log('🏠 홈으로 이동 시작')
      navigate('/', { replace: true })
      console.log('🏠 navigate 호출 완료')
      
      // 콘솔 로그 유지를 위한 설정
      console.log('💡 참고: 콘솔 로그는 "Preserve log" 옵션을 활성화하면 유지됩니다.')
    } catch (err: any) {
      logError('로그인 에러 발생', {
        error: err,
        response: err.response?.data,
        status: err.response?.status,
        message: err.message,
      })
      const errorMessage = err.response?.data?.message || err.message || '로그인에 실패했습니다.'
      setError(errorMessage)
      // 에러가 발생해도 페이지를 유지
      e.stopPropagation()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        maxWidth: '500px',
        margin: '0 auto',
        padding: '2rem',
        minHeight: 'calc(100vh - 200px)',
        display: 'flex',
        alignItems: 'center',
      }}
      className="fade-in"
    >
      <Card
        style={{
          width: '100%',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF9E6 100%)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #66BB6A 0%, #388E3C 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              boxShadow: '0 4px 12px rgba(102, 187, 106, 0.3)',
            }}
          >
            <span style={{ fontSize: '2.5rem' }}>📚</span>
          </div>
          <h2
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #66BB6A 0%, #FFB300 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '0.5rem',
            }}
          >
            로그인
          </h2>
          <p style={{ color: '#9E9E9E', fontSize: '0.875rem' }}>
            PageHub에 오신 것을 환영합니다
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#FFEBEE',
              color: '#C62828',
              borderRadius: '12px',
              marginBottom: '1rem',
              border: '2px solid rgba(239, 83, 80, 0.3)',
              fontWeight: 500,
            }}
          >
            <div style={{ marginBottom: '0.5rem' }}>{error}</div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  const logs = localStorage.getItem('loginLogs')
                  if (logs) {
                    const parsedLogs = JSON.parse(logs)
                    console.log('📋 저장된 로그인 로그:', parsedLogs)
                    alert('콘솔을 확인하세요. 저장된 로그가 출력되었습니다.\n\nF12를 눌러 개발자 도구를 열고 Console 탭을 확인하세요.')
                  } else {
                    alert('저장된 로그인 로그가 없습니다.')
                  }
                }}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.5rem 1rem',
                  background: 'transparent',
                  border: '1px solid #C62828',
                  borderRadius: '8px',
                  color: '#C62828',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                📋 로그인 로그 확인
              </button>
              <button
                type="button"
                onClick={() => {
                  const logs = localStorage.getItem('apiErrorLogs')
                  if (logs) {
                    const parsedLogs = JSON.parse(logs)
                    console.group('📋 저장된 API 에러 로그')
                    parsedLogs.forEach((log: any, index: number) => {
                      console.log(`[${index + 1}]`, log)
                    })
                    console.groupEnd()
                    alert('콘솔을 확인하세요. 저장된 API 에러 로그가 출력되었습니다.\n\nF12를 눌러 개발자 도구를 열고 Console 탭을 확인하세요.')
                  } else {
                    alert('저장된 API 에러 로그가 없습니다.')
                  }
                }}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.5rem 1rem',
                  background: 'transparent',
                  border: '1px solid #C62828',
                  borderRadius: '8px',
                  color: '#C62828',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                📋 API 에러 로그 확인
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Input
            type="text"
            label="ID"
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
            placeholder="ID를 입력하세요"
          />
          <Input
            type="password"
            label="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="비밀번호를 입력하세요"
          />
          <Button type="submit" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </Button>
        </form>

        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(255, 224, 130, 0.3)',
            textAlign: 'center',
          }}
        >
          <p style={{ color: '#9E9E9E', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            아직 계정이 없으신가요?
          </p>
          <Button
            variant="outline"
            onClick={() => navigate('/register')}
            style={{ width: '100%' }}
          >
            회원가입
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default Login
