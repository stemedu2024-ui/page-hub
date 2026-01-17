import { useState, useEffect } from 'react'
import { useFriendStore } from '../store/friendStore'
import { User, FriendshipStatus } from '../types'
import Button from './Button'

interface FriendRequestButtonProps {
  targetUser: User
  currentUserId: string
  size?: 'sm' | 'md' | 'lg'
}

const FriendRequestButton = ({ targetUser, currentUserId, size = 'md' }: FriendRequestButtonProps) => {
  const { sendFriendRequest, respondToRequest, getFriendshipStatus, loading } = useFriendStore()
  const [status, setStatus] = useState<FriendshipStatus>('none')
  const [friendshipId, setFriendshipId] = useState<string | null>(null)

  useEffect(() => {
    // 자기 자신에게는 버튼 표시 안 함
    if (targetUser._id === currentUserId) {
      return
    }

    const checkStatus = async () => {
      try {
        const currentStatus = await getFriendshipStatus(targetUser._id)
        setStatus(currentStatus)
        
        // pending 상태인 경우 friendshipId 찾기
        if (currentStatus === 'pending_received' || currentStatus === 'pending_sent') {
          // 받은 요청 목록에서 찾기
          const { receivedRequests, sentRequests } = useFriendStore.getState()
          const allRequests = [...receivedRequests, ...sentRequests]
          const friendship = allRequests.find(
            (req) =>
              (typeof req.requester === 'object' && req.requester._id === targetUser._id) ||
              (typeof req.recipient === 'object' && req.recipient._id === targetUser._id)
          )
          if (friendship) {
            setFriendshipId(friendship._id)
          }
        }
      } catch (error) {
        console.error('친구 상태 확인 실패:', error)
      }
    }

    checkStatus()
  }, [targetUser._id, currentUserId, getFriendshipStatus])

  const handleSendRequest = async () => {
    try {
      await sendFriendRequest(targetUser._id)
      setStatus('pending_sent')
      alert('친구 요청이 전송되었습니다.')
    } catch (error: any) {
      alert(error.response?.data?.message || '친구 요청 전송에 실패했습니다.')
    }
  }

  const handleAccept = async () => {
    if (!friendshipId) return
    try {
      await respondToRequest(friendshipId, 'accepted')
      setStatus('accepted')
      alert('친구 요청이 승인되었습니다.')
    } catch (error: any) {
      alert(error.response?.data?.message || '친구 요청 승인에 실패했습니다.')
    }
  }

  const handleReject = async () => {
    if (!friendshipId) return
    try {
      await respondToRequest(friendshipId, 'rejected')
      setStatus('none')
      alert('친구 요청이 거절되었습니다.')
    } catch (error: any) {
      alert(error.response?.data?.message || '친구 요청 거절에 실패했습니다.')
    }
  }

  // 자기 자신에게는 버튼 표시 안 함
  if (targetUser._id === currentUserId) {
    return null
  }

  // 이미 친구인 경우
  if (status === 'accepted') {
    return (
      <Button variant="secondary" size={size} disabled>
        ✅ 친구
      </Button>
    )
  }

  // 보낸 요청이 대기 중인 경우
  if (status === 'pending_sent') {
    return (
      <Button variant="outline" size={size} disabled>
        ⏳ 요청 대기 중
      </Button>
    )
  }

  // 받은 요청이 대기 중인 경우
  if (status === 'pending_received') {
    return (
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Button variant="primary" size={size} onClick={handleAccept} disabled={loading}>
          ✓ 승인
        </Button>
        <Button variant="danger" size={size} onClick={handleReject} disabled={loading}>
          ✕ 거절
        </Button>
      </div>
    )
  }

  // 기본 상태: 친구 요청 보내기
  return (
    <Button variant="primary" size={size} onClick={handleSendRequest} disabled={loading}>
      + 친구 요청
    </Button>
  )
}

export default FriendRequestButton
