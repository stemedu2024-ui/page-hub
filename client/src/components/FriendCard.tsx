import { User, Friendship } from '../types'
import FriendRequestButton from './FriendRequestButton'
import Card from './Card'
import Button from './Button'
import { useAuthStore } from '../store/authStore'
import { useFriendStore } from '../store/friendStore'

interface FriendCardProps {
  user: User
  friendship?: Friendship
  showRequestButton?: boolean
  showUnfriendButton?: boolean
  onAction?: () => void
}

const FriendCard = ({ user, friendship, showRequestButton = false, showUnfriendButton = false, onAction }: FriendCardProps) => {
  const { user: currentUser } = useAuthStore()
  const { unfriend, loading } = useFriendStore()

  const handleUnfriend = async () => {
    if (!window.confirm(`정말 ${user.nickname}님과 친구를 끊으시겠습니까?`)) {
      return
    }

    try {
      await unfriend(user._id)
      alert('친구 관계가 해제되었습니다.')
    } catch (error: any) {
      alert(error.response?.data?.message || '친구 끊기에 실패했습니다.')
    }
  }

  const getRequester = () => {
    if (!friendship) return null
    if (typeof friendship.requester === 'object') {
      return friendship.requester
    }
    return null
  }

  const getRecipient = () => {
    if (!friendship) return null
    if (typeof friendship.recipient === 'object') {
      return friendship.recipient
    }
    return null
  }

  return (
    <Card
      style={{
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
        {/* 프로필 아바타 */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#FFE082',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#388E3C',
            fontWeight: 'bold',
            fontSize: '1.5rem',
            boxShadow: '0 2px 6px rgba(255, 179, 0, 0.2)',
            flexShrink: 0,
          }}
        >
          {user.nickname[0] || 'U'}
        </div>

        {/* 사용자 정보 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 'bold',
              fontSize: '1.1rem',
              color: '#212121',
              marginBottom: '0.25rem',
            }}
          >
            {user.nickname}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#9E9E9E' }}>
            {user.name}
            {user.class && ` · ${user.class}반`}
            {user.role === 'teacher' && ' · 선생님'}
          </div>
          {friendship && (
            <div style={{ fontSize: '0.75rem', color: '#66BB6A', marginTop: '0.25rem' }}>
              {friendship.status === 'pending' && '⏳ 요청 대기 중'}
              {friendship.status === 'accepted' && '✅ 친구'}
              {friendship.status === 'rejected' && '❌ 거절됨'}
            </div>
          )}
        </div>
      </div>

      {/* 액션 버튼 */}
      {showRequestButton && currentUser && (
        <div style={{ flexShrink: 0 }}>
          <FriendRequestButton targetUser={user} currentUserId={currentUser._id} size="sm" />
        </div>
      )}

      {showUnfriendButton && currentUser && (!friendship || friendship?.status === 'accepted') && (
        <div style={{ flexShrink: 0 }}>
          <Button
            variant="danger"
            size="sm"
            onClick={handleUnfriend}
            disabled={loading}
          >
            🗑️ 친구 끊기
          </Button>
        </div>
      )}

      {onAction && (
        <div style={{ flexShrink: 0 }}>
          <button
            onClick={onAction}
            style={{
              padding: '0.5rem 1rem',
              background: 'transparent',
              border: '1px solid #66BB6A',
              borderRadius: '12px',
              color: '#66BB6A',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            상세보기
          </button>
        </div>
      )}
    </Card>
  )
}

export default FriendCard
