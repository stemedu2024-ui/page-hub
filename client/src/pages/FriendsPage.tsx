import { useEffect, useState, useRef } from 'react'
import { useFriendStore } from '../store/friendStore'
import { useAuthStore } from '../store/authStore'
import FriendCard from '../components/FriendCard'
import FriendRecommendations from '../components/FriendRecommendations'
import Button from '../components/Button'
import Card from '../components/Card'
import { Friendship, User } from '../types'

const FriendsPage = () => {
  const {
    friends,
    receivedRequests,
    sentRequests,
    searchResults,
    searchQuery,
    loading,
    searchLoading,
    error,
    searchError,
    fetchFriends,
    fetchReceivedRequests,
    fetchSentRequests,
    searchUsers,
    clearSearchResults,
    sendFriendRequest,
    respondToRequest,
    getFriendshipStatus,
    clearError,
  } = useFriendStore()

  const [activeTab, setActiveTab] = useState<'friends' | 'received' | 'sent' | 'recommendations' | 'search'>('friends')
  const [searchInput, setSearchInput] = useState('')
  const [friendshipStatuses, setFriendshipStatuses] = useState<{ [userId: string]: 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'rejected' }>({})
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    // 인증된 상태에서만 친구 데이터 로드
    if (isAuthenticated) {
      console.log('👥 FriendsPage: 친구 데이터 로드 시작')
      fetchFriends().catch((err) => {
        console.error('👥 FriendsPage: 친구 목록 로드 실패', err)
      })
      fetchReceivedRequests().catch((err) => {
        console.error('👥 FriendsPage: 받은 요청 로드 실패', err)
      })
      fetchSentRequests().catch((err) => {
        console.error('👥 FriendsPage: 보낸 요청 로드 실패', err)
      })
    }
  }, [fetchFriends, fetchReceivedRequests, fetchSentRequests, isAuthenticated])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  // 검색어 변경 시 debounce 처리
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (searchInput.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchUsers(searchInput.trim())
      }, 500)
    } else {
      clearSearchResults()
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchInput, searchUsers, clearSearchResults])

  // 검색 결과의 친구 상태 확인
  useEffect(() => {
    const checkStatuses = async () => {
      if (searchResults.length === 0) return

      const statuses: { [userId: string]: 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'rejected' } = {}
      
      for (const user of searchResults) {
        try {
          const status = await getFriendshipStatus(user._id)
          statuses[user._id] = status
        } catch (error) {
          statuses[user._id] = 'none'
        }
      }

      setFriendshipStatuses(statuses)
    }

    checkStatuses()
  }, [searchResults, getFriendshipStatus])

  const handleRespond = async (friendshipId: string, response: 'accepted' | 'rejected') => {
    try {
      await respondToRequest(friendshipId, response)
      if (response === 'accepted') {
        alert('친구 요청이 승인되었습니다.')
      } else {
        alert('친구 요청이 거절되었습니다.')
      }
      // 검색 결과 상태 업데이트
      if (searchResults.length > 0) {
        const statuses: { [userId: string]: 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'rejected' } = {}
        for (const user of searchResults) {
          try {
            const status = await getFriendshipStatus(user._id)
            statuses[user._id] = status
          } catch (error) {
            statuses[user._id] = 'none'
          }
        }
        setFriendshipStatuses(statuses)
      }
    } catch (error: any) {
      alert(error.response?.data?.message || '요청 처리에 실패했습니다.')
    }
  }

  const handleSearchRequest = async (userId: string) => {
    try {
      await sendFriendRequest(userId)
      alert('친구 요청이 전송되었습니다.')
      // 검색 결과 상태 업데이트
      const status = await getFriendshipStatus(userId)
      setFriendshipStatuses((prev) => ({ ...prev, [userId]: status }))
    } catch (error: any) {
      alert(error.response?.data?.message || '친구 요청 전송에 실패했습니다.')
    }
  }

  const renderContent = () => {
    if (loading && activeTab === 'friends' && friends.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#66BB6A' }}>
          로딩 중...
        </div>
      )
    }

    switch (activeTab) {
      case 'friends':
        if (friends.length === 0) {
          return (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#9E9E9E',
                background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF9E6 100%)',
                borderRadius: '16px',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <p style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>친구가 없습니다.</p>
              <p style={{ fontSize: '0.9rem' }}>추천 친구 탭에서 친구를 찾아보세요!</p>
            </div>
          )
        }
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {friends.map((friend) => (
              <FriendCard key={friend._id} user={friend} showUnfriendButton={true} />
            ))}
          </div>
        )

      case 'received':
        if (receivedRequests.length === 0) {
          return (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#9E9E9E',
                background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF9E6 100%)',
                borderRadius: '16px',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              받은 친구 요청이 없습니다.
            </div>
          )
        }
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {receivedRequests.map((request) => {
              const requester = typeof request.requester === 'object' ? request.requester : null
              if (!requester) return null

              return (
                <Card key={request._id} style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          backgroundColor: '#FFE082',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#388E3C',
                          fontWeight: 'bold',
                          fontSize: '1.25rem',
                        }}
                      >
                        {requester.nickname[0] || 'U'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{requester.nickname}</div>
                        <div style={{ fontSize: '0.875rem', color: '#9E9E9E' }}>
                          {requester.name}
                          {requester.class && ` · ${requester.class}반`}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleRespond(request._id, 'accepted')}
                        disabled={loading}
                      >
                        ✓ 승인
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRespond(request._id, 'rejected')}
                        disabled={loading}
                      >
                        ✕ 거절
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )

      case 'sent':
        if (sentRequests.length === 0) {
          return (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#9E9E9E',
                background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF9E6 100%)',
                borderRadius: '16px',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              보낸 친구 요청이 없습니다.
            </div>
          )
        }
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {sentRequests.map((request) => {
              const recipient = typeof request.recipient === 'object' ? request.recipient : null
              if (!recipient) return null

              return (
                <FriendCard
                  key={request._id}
                  user={recipient}
                  friendship={request}
                />
              )
            })}
          </div>
        )

      case 'recommendations':
        return <FriendRecommendations />

      case 'search':
        return (
          <div>
            {/* 검색 입력창 */}
            <div style={{ marginBottom: '1.5rem' }}>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="ID, 닉네임, 이름으로 검색... (최소 2글자)"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid rgba(255, 224, 130, 0.5)',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#FFE082'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 224, 130, 0.5)'
                }}
              />
            </div>

            {/* 검색 에러 */}
            {searchError && (
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: '#FFEBEE',
                  color: '#C62828',
                  borderRadius: '12px',
                  marginBottom: '1rem',
                }}
              >
                {searchError}
              </div>
            )}

            {/* 검색 로딩 */}
            {searchLoading && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#66BB6A' }}>
                검색 중...
              </div>
            )}

            {/* 검색 결과 */}
            {!searchLoading && searchInput.trim().length >= 2 && searchResults.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3rem',
                  color: '#9E9E9E',
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF9E6 100%)',
                  borderRadius: '16px',
                }}
              >
                검색 결과가 없습니다.
              </div>
            )}

            {!searchLoading && searchResults.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ fontSize: '0.875rem', color: '#9E9E9E', marginBottom: '0.5rem' }}>
                  검색 결과 ({searchResults.length}명)
                </div>
                {searchResults.map((user) => {
                  const status = friendshipStatuses[user._id] || 'none'
                  return (
                    <Card key={user._id} style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                          <div
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #66BB6A 0%, #388E3C 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '1.25rem',
                            }}
                          >
                            {user.nickname[0] || 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{user.nickname}</div>
                            <div style={{ fontSize: '0.875rem', color: '#9E9E9E' }}>
                              {user.name}
                              {user.class && ` · ${user.class}반`}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#9E9E9E' }}>ID: {user.id}</div>
                          </div>
                        </div>
                        <div>
                          {status === 'none' || status === 'rejected' ? (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleSearchRequest(user._id)}
                              disabled={loading}
                            >
                              친구 추가
                            </Button>
                          ) : status === 'pending_sent' ? (
                            <Button variant="secondary" size="sm" disabled>
                              요청됨
                            </Button>
                          ) : status === 'pending_received' ? (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={async () => {
                                  // 받은 요청 목록에서 찾기
                                  const request = receivedRequests.find(
                                    (r) =>
                                      (typeof r.requester === 'object' && r.requester._id === user._id) ||
                                      (typeof r.requester === 'string' && r.requester === user._id)
                                  )
                                  if (request) {
                                    await handleRespond(request._id, 'accepted')
                                  }
                                }}
                                disabled={loading}
                              >
                                수락
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={async () => {
                                  const request = receivedRequests.find(
                                    (r) =>
                                      (typeof r.requester === 'object' && r.requester._id === user._id) ||
                                      (typeof r.requester === 'string' && r.requester === user._id)
                                  )
                                  if (request) {
                                    await handleRespond(request._id, 'rejected')
                                  }
                                }}
                                disabled={loading}
                              >
                                거절
                              </Button>
                            </div>
                          ) : (
                            <Button variant="secondary" size="sm" disabled>
                              친구
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* 검색 안내 */}
            {!searchLoading && searchInput.trim().length < 2 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3rem',
                  color: '#9E9E9E',
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF9E6 100%)',
                  borderRadius: '16px',
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔍</div>
                <p style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>친구를 검색해보세요</p>
                <p style={{ fontSize: '0.9rem' }}>ID, 닉네임, 이름으로 검색할 수 있습니다.</p>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }} className="fade-in">
      <h1
        style={{
          fontSize: '2.5rem',
          fontWeight: 700,
          background: 'linear-gradient(135deg, #66BB6A 0%, #FFB300 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '2rem',
        }}
      >
        👥 친구
      </h1>

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
          {error}
        </div>
      )}

      {/* 탭 메뉴 */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          borderBottom: '2px solid rgba(255, 224, 130, 0.3)',
          paddingBottom: '0.5rem',
        }}
      >
        <Button
          variant={activeTab === 'friends' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('friends')}
        >
          친구 ({friends.length})
        </Button>
        <Button
          variant={activeTab === 'received' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('received')}
        >
          받은 요청 ({receivedRequests.length})
        </Button>
        <Button
          variant={activeTab === 'sent' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('sent')}
        >
          보낸 요청 ({sentRequests.length})
        </Button>
        <Button
          variant={activeTab === 'recommendations' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('recommendations')}
        >
          추천 친구
        </Button>
        <Button
          variant={activeTab === 'search' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => {
            setActiveTab('search')
            if (searchInput.trim().length >= 2) {
              searchUsers(searchInput.trim())
            }
          }}
        >
          검색
        </Button>
      </div>

      {/* 콘텐츠 */}
      {renderContent()}
    </div>
  )
}

export default FriendsPage
