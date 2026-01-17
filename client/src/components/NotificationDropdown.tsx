import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotificationStore } from '../store/notificationStore'
import { Notification } from '../types'
import Button from './Button'

interface NotificationDropdownProps {
  isOpen: boolean
  onClose: () => void
}

const NotificationDropdown = ({ isOpen, onClose }: NotificationDropdownProps) => {
  const navigate = useNavigate()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const {
    notifications,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationStore()

  const [isMarkingAll, setIsMarkingAll] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchNotifications(10) // 최신 10개만 표시
    }
  }, [isOpen, fetchNotifications])

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const handleNotificationClick = async (notification: Notification) => {
    // 읽지 않은 알림이면 읽음 처리
    if (!notification.read) {
      try {
        await markAsRead(notification._id)
      } catch (error) {
        console.error('알림 읽음 처리 실패:', error)
      }
    }

    // 알림 타입에 따라 이동
    if (notification.type === 'friend_request') {
      navigate('/friends')
      onClose()
    } else if (notification.relatedPost) {
      // 포스트 관련 알림 (좋아요, 댓글, 질문 답변)
      const postId = typeof notification.relatedPost === 'string' 
        ? notification.relatedPost 
        : notification.relatedPost._id
      
      // 댓글, 답글, 또는 태그 알림인 경우 댓글 ID도 함께 전달
      if (
        (notification.type === 'comment' ||
          notification.type === 'reply' ||
          notification.type === 'mention') &&
        notification.relatedComment
      ) {
        navigate(`/feed?postId=${postId}&commentId=${notification.relatedComment}`)
      } else {
        navigate(`/feed?postId=${postId}`)
      }
      onClose()
    } else {
      navigate('/feed')
      onClose()
    }
  }

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true)
    try {
      await markAllAsRead()
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error)
    } finally {
      setIsMarkingAll(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation()
    if (window.confirm('알림을 삭제하시겠습니까?')) {
      try {
        await deleteNotification(notificationId)
      } catch (error) {
        console.error('알림 삭제 실패:', error)
      }
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return '💬'
      case 'question_answer':
        return '✅'
      case 'friend_request':
        return '👤'
      case 'like':
        return '❤️'
      case 'announcement':
        return '📢'
      case 'reply':
        return '↩️'
      case 'mention':
        return '🏷️'
      default:
        return '🔔'
    }
  }

  if (!isOpen) return null

  return (
    <div
      ref={dropdownRef}
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: '0.5rem',
        width: '400px',
        maxWidth: '90vw',
        maxHeight: '500px',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        border: '1px solid rgba(255, 224, 130, 0.3)',
        zIndex: 1000,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          padding: '1rem',
          borderBottom: '1px solid rgba(255, 224, 130, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#212121' }}>
          알림
        </h3>
        {notifications.some((n) => !n.read) && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAll}
          >
            모두 읽음
          </Button>
        )}
      </div>

      {/* 알림 목록 */}
      <div
        style={{
          overflowY: 'auto',
          flex: 1,
        }}
      >
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#9E9E9E' }}>
            알림을 불러오는 중...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#9E9E9E' }}>
            알림이 없습니다
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification._id}
              onClick={() => handleNotificationClick(notification)}
              style={{
                padding: '1rem',
                borderBottom: '1px solid rgba(255, 224, 130, 0.2)',
                cursor: 'pointer',
                backgroundColor: notification.read ? '#FFFFFF' : '#FFF9E6',
                transition: 'background-color 0.2s',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = notification.read ? '#F5F5F5' : '#FFE082'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = notification.read ? '#FFFFFF' : '#FFF9E6'
              }}
            >
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div
                  style={{
                    fontSize: '1.5rem',
                    flexShrink: 0,
                  }}
                >
                  {getNotificationIcon(notification.type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.875rem',
                      color: '#212121',
                      lineHeight: '1.5',
                      fontWeight: notification.read ? 400 : 600,
                    }}
                  >
                    {notification.message}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: '#9E9E9E',
                      marginTop: '0.25rem',
                    }}
                  >
                    {new Date(notification.createdAt).toLocaleString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                {!notification.read && (
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#EF5350',
                      flexShrink: 0,
                      marginTop: '0.25rem',
                    }}
                  />
                )}
                <button
                  onClick={(e) => handleDelete(e, notification._id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.25rem',
                    color: '#9E9E9E',
                    padding: '0.25rem',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#EF5350'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#9E9E9E'
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default NotificationDropdown
