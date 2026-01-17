import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useNotificationStore } from '../store/notificationStore'
import { socketService, ConnectionState } from '../services/socketService'
import Button from './Button'
import NotificationDropdown from './NotificationDropdown'

const Header = () => {
  const { isAuthenticated, user, logout } = useAuthStore()
  const { unreadCount, fetchUnreadCount, addNotificationFromSocket } = useNotificationStore()
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')

  // Socket.IO 연결 상태 구독
  useEffect(() => {
    // 초기 상태 설정
    setConnectionState(socketService.getConnectionState())
    
    // 상태 변경 구독
    const unsubscribe = socketService.onStateChange((state) => {
      setConnectionState(state)
    })
    
    return unsubscribe
  }, [])

  // Socket.IO 알림 이벤트 리스너
  useEffect(() => {
    if (connectionState !== 'connected') {
      return
    }

    const handleNotificationNew = (notification: any) => {
      addNotificationFromSocket(notification)
      // 읽지 않은 알림 개수도 업데이트
      fetchUnreadCount()
    }

    socketService.on('notification:new', handleNotificationNew)

    return () => {
      socketService.off('notification:new', handleNotificationNew)
    }
  }, [connectionState, addNotificationFromSocket, fetchUnreadCount])

  // 알림 개수 폴링 (30초마다) - Socket.IO가 연결되지 않은 경우 폴백
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount()
      const interval = setInterval(() => {
        if (connectionState !== 'connected') {
          fetchUnreadCount()
        }
      }, 30000) // 30초

      return () => clearInterval(interval)
    }
  }, [isAuthenticated, connectionState, fetchUnreadCount])

  return (
    <header
      style={{
        background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF9E6 100%)',
        padding: '1rem 2rem',
        borderBottom: '2px solid rgba(255, 224, 130, 0.3)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(10px)',
      }}
    >
      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <Link
          to="/"
          style={{
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #66BB6A 0%, #388E3C 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1.25rem',
              boxShadow: '0 4px 6px rgba(102, 187, 106, 0.3)',
            }}
          >
            P
          </div>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #66BB6A 0%, #FFB300 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: 0,
            }}
          >
            PageHub
          </h1>
        </Link>
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {isAuthenticated ? (
            <>
              <Link
                to="/feed"
                style={{
                  textDecoration: 'none',
                  color: '#66BB6A',
                  fontWeight: 500,
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#E8F5E9'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                피드
              </Link>
              <Link
                to="/friends"
                style={{
                  textDecoration: 'none',
                  color: '#66BB6A',
                  fontWeight: 500,
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#E8F5E9'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                친구
              </Link>
              {/* Socket 연결 상태 표시 */}
              {isAuthenticated && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '12px',
                    backgroundColor:
                      connectionState === 'connected'
                        ? '#E8F5E9'
                        : connectionState === 'connecting' || connectionState === 'reconnecting'
                        ? '#FFF3E0'
                        : '#FFEBEE',
                    fontSize: '0.75rem',
                    color:
                      connectionState === 'connected'
                        ? '#388E3C'
                        : connectionState === 'connecting' || connectionState === 'reconnecting'
                        ? '#F57C00'
                        : '#C62828',
                  }}
                  title={
                    connectionState === 'connected'
                      ? '실시간 연결됨'
                      : connectionState === 'connecting'
                      ? '실시간 연결 중…'
                      : connectionState === 'reconnecting'
                      ? '오프라인 (복구 중)'
                      : '오프라인'
                  }
                >
                  <span>
                    {connectionState === 'connected'
                      ? '🟢'
                      : connectionState === 'connecting' || connectionState === 'reconnecting'
                      ? '🟡'
                      : '🔴'}
                  </span>
                  <span>
                    {connectionState === 'connected'
                      ? '실시간'
                      : connectionState === 'connecting'
                      ? '연결 중…'
                      : connectionState === 'reconnecting'
                      ? '복구 중'
                      : '오프라인'}
                  </span>
                </div>
              )}
              {/* 알림 아이콘 */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 224, 130, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>🔔</span>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '0',
                        right: '0',
                        backgroundColor: '#EF5350',
                        color: 'white',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        border: '2px solid white',
                      }}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                <NotificationDropdown
                  isOpen={isNotificationOpen}
                  onClose={() => setIsNotificationOpen(false)}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: 'rgba(255, 224, 130, 0.2)',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                }}
              >
                <span style={{ color: '#388E3C', fontWeight: 500 }}>
                  안녕하세요, <strong>{user?.nickname}</strong>님
                </span>
              </div>
              <Button variant="secondary" onClick={logout}>
                로그아웃
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="secondary">로그인</Button>
              </Link>
              <Link to="/register">
                <Button>회원가입</Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}

export default Header
