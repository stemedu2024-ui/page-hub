import { useEffect, useRef, useState } from 'react'
import { usePostStore } from '../store/postStore'
import { useAuthStore } from '../store/authStore'
import { useFriendStore } from '../store/friendStore'
import { socketService } from '../services/socketService'
import { getPostReads } from '../services/postService'
import PostCard from './PostCard'
import Button from './Button'
import CommentSection from './CommentSection'
import { spacing, radius, fontSize, fontWeight, colors, shadow, transition } from '../styles/designSystem'

interface PostModalProps {
  postId: string
  commentId?: string
  onClose: () => void
}

const PostModal = ({ postId, commentId, onClose }: PostModalProps) => {
  const { currentPost, postLoading, error, fetchPostById } = usePostStore()
  const { user } = useAuthStore()
  const { friends } = useFriendStore()
  const modalRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previousActiveElementRef = useRef<HTMLElement | null>(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [readUsers, setReadUsers] = useState<{ userId: string; timestamp: string }[]>([])
  const [viewingUserIds, setViewingUserIds] = useState<Set<string>>(new Set())

  // 모바일 여부 감지
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 포스트 로드 및 댓글 처리 (로딩 순서 보장)
  useEffect(() => {
    if (postId) {
      fetchPostById(postId).catch((err) => {
        console.error('포스트 로드 실패:', err)
      })
    }
  }, [postId, fetchPostById])

  // Socket.IO: Post View Presence (Phase 5)
  useEffect(() => {
    if (postId && socketService.isConnected()) {
      // 기존 join:post도 유지 (호환성)
      socketService.joinPost(postId)
      
      // Phase 4 post:view:start 이벤트 emit
      const socket = socketService.getSocket()
      if (socket) {
        socket.emit('post:view:start', { postId })
      }
      
      return () => {
        // Phase 4 post:view:end 이벤트 emit
        const socket = socketService.getSocket()
        if (socket) {
          socket.emit('post:view:end', { postId })
        }
        
        // 기존 leave:post도 유지 (호환성)
        socketService.leavePost(postId)
        
        // Read Receipt 상태 초기화
        setReadUsers([])
        // Presence 상태 초기화
        setViewingUserIds(new Set())
      }
    }
  }, [postId])

  // Read Receipt: 포스트 읽음 처리 (Phase 5)
  useEffect(() => {
    if (currentPost && !postLoading && socketService.isConnected()) {
      // 포스트가 로드되면 읽음 표시
      const socket = socketService.getSocket()
      if (socket) {
        socket.emit('post:read', { postId: currentPost._id })
      }
    }
  }, [currentPost, postLoading, postId])

  // Read Receipt: DB에서 초기 로드 (Phase 7-A)
  useEffect(() => {
    if (currentPost && !postLoading && postId) {
      // DB에서 Read 목록 조회
      getPostReads(postId)
        .then((data) => {
          // DB 데이터로 초기 상태 설정
          setReadUsers(data.users)
        })
        .catch((err) => {
          // 에러 시 기존 Socket 기반 상태 유지
          console.error('Read 목록 조회 실패:', err)
        })
    }
  }, [currentPost, postLoading, postId])

  // 친구 목록 불러오기 (Read Receipt UI 개선을 위해)
  useEffect(() => {
    if (user && friends.length === 0) {
      useFriendStore.getState().fetchFriends()
    }
  }, [user, friends.length])

  // Presence: 현재 조회 중인 사용자 수신 (Phase 7-B)
  useEffect(() => {
    if (!socketService.isConnected() || !postId) {
      return
    }

    const handlePresenceUpdate = (data: { postId: string; userId: string; action: 'start' | 'end' }) => {
      // 자신의 Presence 상태는 무시
      if (data.userId === user?._id) {
        return
      }

      // 해당 포스트의 Presence 상태만 처리
      if (data.postId !== postId) {
        return
      }

      setViewingUserIds((prev) => {
        const newSet = new Set(prev)
        if (data.action === 'start') {
          newSet.add(data.userId)
        } else {
          newSet.delete(data.userId)
        }
        return newSet
      })
    }

    socketService.on('post:view:presence:update', handlePresenceUpdate)

    return () => {
      socketService.off('post:view:presence:update', handlePresenceUpdate)
      // Presence 상태 초기화
      setViewingUserIds(new Set())
    }
  }, [postId, user?._id])


  // Read Receipt: 다른 사용자의 읽음 상태 수신 (Phase 5, Phase 6 UI 개선)
  useEffect(() => {
    if (!socketService.isConnected() || !postId) {
      return
    }

    const handleReadUpdate = (data: { postId: string; userId: string; timestamp: string }) => {
      // 자신의 읽음 상태는 무시
      if (data.userId === user?._id) {
        return
      }

      // 해당 포스트의 읽음 상태만 처리
      if (data.postId !== postId) {
        return
      }

      // 읽음 상태 업데이트 (중복 제거)
      setReadUsers((prev) => {
        const exists = prev.find((r) => r.userId === data.userId)
        if (exists) {
          return prev.map((r) => (r.userId === data.userId ? data : r))
        }
        return [...prev, data]
      })
    }

    socketService.on('post:read:update', handleReadUpdate)

    return () => {
      socketService.off('post:read:update', handleReadUpdate)
    }
  }, [postId, user?._id])

  // userId를 닉네임으로 변환하는 헬퍼 함수 (Phase 6)
  const getUserNickname = (userId: string): string => {
    // 친구 목록에서 찾기
    const friend = friends.find((f) => f._id === userId)
    if (friend) {
      return friend.nickname
    }
    
    // 포스트 작성자 확인
    if (currentPost?.author && typeof currentPost.author === 'object' && currentPost.author._id === userId) {
      return currentPost.author.nickname
    }
    
    // 찾을 수 없으면 기본값
    return '사용자'
  }

  // commentId가 있고 포스트가 로드되면 댓글 섹션 자동 열기
  useEffect(() => {
    if (commentId && currentPost && !postLoading) {
      // PostCard 내부의 CommentSection이 댓글을 로드할 때까지 대기
      // CommentSection은 post._id가 변경되면 자동으로 fetchComments를 호출함
      // 따라서 여기서는 추가 작업이 필요 없음 (CommentSection의 useLayoutEffect가 처리)
    }
  }, [commentId, currentPost, postLoading])

  // 접근성: 포커스 트랩 및 모달 관리 (Phase 7-C-1)
  useEffect(() => {
    // 모달 열릴 때 이전 포커스 저장
    previousActiveElementRef.current = document.activeElement as HTMLElement

    // 모달 열릴 때 첫 포커스를 닫기 버튼에 설정
    if (closeButtonRef.current) {
      setTimeout(() => {
        closeButtonRef.current?.focus()
      }, 100)
    }

    // 포커스 트랩: Tab 키로 모달 내부 순환
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )

      if (!focusableElements || focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (e.shiftKey) {
        // Shift+Tab: 역순
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab: 순방향
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    // ESC 키로 모달 닫기
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleTab)
    document.addEventListener('keydown', handleEscape)

    // 모달 닫힐 때 이전 포커스 복귀
    return () => {
      document.removeEventListener('keydown', handleTab)
      document.removeEventListener('keydown', handleEscape)
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus()
      }
    }
  }, [onClose])

  // 포커스 트랩 (모달 내부에 포커스 유지)
  useEffect(() => {
    if (modalRef.current && currentPost) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      const handleTab = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement?.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement?.focus()
          }
        }
      }

      modalRef.current.addEventListener('keydown', handleTab)
      // 모달이 열릴 때 첫 번째 포커스 가능한 요소에 포커스
      setTimeout(() => {
        firstElement?.focus()
      }, 100)

      return () => {
        modalRef.current?.removeEventListener('keydown', handleTab)
      }
    }
  }, [currentPost])

  // 배경 클릭으로 모달 닫기
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) {
      onClose()
    }
  }

  return (
      <div
        ref={overlayRef}
        onClick={handleOverlayClick}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: isMobile ? colors.overlayDark : colors.overlay,
          display: 'flex',
          alignItems: isMobile ? 'flex-end' : 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: isMobile ? 0 : spacing.lg,
          overflowY: isMobile ? 'hidden' : 'auto',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-modal-title"
        aria-describedby={currentPost ? "post-modal-description" : undefined}
      >
        <div
          ref={modalRef}
          style={{
            width: '100%',
            maxWidth: isMobile ? '100%' : '800px',
            maxHeight: isMobile ? '100vh' : '90vh',
            height: isMobile ? '100vh' : 'auto',
            backgroundColor: colors.background,
            borderRadius: isMobile ? `${radius.md} ${radius.md} 0 0` : radius.md,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            margin: 'auto',
            outline: 'none',
            ...(isMobile && {
              marginTop: 'auto',
              marginBottom: 0,
            }),
          }}
          onClick={(e) => e.stopPropagation()}
          tabIndex={-1}
        >
        {/* 닫기 버튼 - Phase 7-D: 디자인 시스템 적용 */}
        <button
          ref={closeButtonRef}
          onClick={onClose}
          style={{
            position: 'absolute',
            top: isMobile ? spacing.md : spacing.lg,
            right: isMobile ? spacing.md : spacing.lg,
            width: isMobile ? '44px' : '40px',
            height: isMobile ? '44px' : '40px',
            minWidth: '44px',
            minHeight: '44px',
            borderRadius: radius.full,
            border: 'none',
            backgroundColor: colors.backgroundTertiary,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? fontSize.xxxl : fontSize.xxl,
            color: colors.textPrimary,
            zIndex: 10,
            transition: transition.base,
            ...(isMobile && {
              WebkitTapHighlightColor: 'transparent',
            }),
          }}
          onMouseEnter={(e) => {
            if (!isMobile) {
              e.currentTarget.style.backgroundColor = colors.divider
            }
          }}
          onMouseLeave={(e) => {
            if (!isMobile) {
              e.currentTarget.style.backgroundColor = colors.backgroundTertiary
            }
          }}
          onTouchStart={(e) => {
            if (isMobile) {
              e.currentTarget.style.backgroundColor = colors.divider
              e.currentTarget.style.transform = 'scale(0.95)'
            }
          }}
          onTouchEnd={(e) => {
            if (isMobile) {
              e.currentTarget.style.backgroundColor = colors.backgroundTertiary
              e.currentTarget.style.transform = 'scale(1)'
            }
          }}
          aria-label="모달 닫기"
        >
          ×
        </button>

        {/* 모달 내용 - Phase 7-D: 자연스러운 텍스트 흐름 */}
        <div
          style={{
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: isMobile ? spacing.lg : spacing.xl,
            paddingTop: isMobile ? '56px' : '64px', // 닫기 버튼 공간
            paddingBottom: isMobile ? `calc(${spacing.lg} + env(safe-area-inset-bottom, 0))` : spacing.xl,
            flex: 1,
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {postLoading && (
            <div
              style={{
                textAlign: 'center',
                padding: spacing.xxxl,
                color: colors.textTertiary,
                fontSize: fontSize.lg,
              }}
            >
              <div style={{ marginBottom: spacing.lg, fontSize: fontSize.xxxl }}>⏳</div>
              포스트를 불러오는 중...
            </div>
          )}

          {error && !postLoading && (
            <div
              style={{
                padding: spacing.xl,
                textAlign: 'center',
                backgroundColor: colors.errorLight,
                color: colors.error,
                borderRadius: radius.md,
              }}
            >
              <div style={{ fontSize: fontSize.xxxl, marginBottom: spacing.lg }}>⚠️</div>
              <h3 style={{ marginBottom: spacing.sm, fontSize: fontSize.xl, fontWeight: fontWeight.semibold }}>
                포스트를 불러올 수 없습니다
              </h3>
              <p style={{ fontSize: fontSize.sm, marginBottom: spacing.lg, color: colors.textSecondary }}>{error}</p>
              <Button onClick={onClose} variant="secondary">
                닫기
              </Button>
            </div>
          )}

          {currentPost && !postLoading && (
            <div>
              {/* 접근성: aria-labelledby와 aria-describedby를 위한 숨김 제목/설명 (Phase 7-C-1) */}
              <div id="post-modal-title" style={{ display: 'none' }}>
                {currentPost.type === 'question' && currentPost.title
                  ? `질문: ${currentPost.title}`
                  : '포스트 상세'}
              </div>
              <div id="post-modal-description" style={{ display: 'none' }}>
                {currentPost.type === 'question' && currentPost.title
                  ? `${currentPost.title} - ${(currentPost.author as any)?.nickname || '익명'}님의 질문`
                  : `${(currentPost.author as any)?.nickname || '익명'}님의 포스트`}
              </div>

              {/* Presence / Read Receipt UI - Phase 7-D: 최소화 (필요시에만 표시) */}
              {(viewingUserIds.size > 0 || readUsers.length > 0) && (
                <div
                  aria-live="polite"
                  aria-atomic="true"
                  style={{
                    marginBottom: spacing.lg,
                    padding: spacing.md,
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: radius.sm,
                    fontSize: fontSize.xs,
                    color: colors.textSecondary,
                    borderLeft: `3px solid ${colors.primary}`,
                  }}
                >
                  {viewingUserIds.size > 0 && (() => {
                    const viewingArray = Array.from(viewingUserIds)
                    const friendViewing = viewingArray.filter((userId) => 
                      friends.some((f) => f._id === userId)
                    )
                    const nonFriendCount = viewingArray.length - friendViewing.length

                    let displayText = ''
                    if (friendViewing.length > 0) {
                      if (friendViewing.length <= 2) {
                        displayText = friendViewing.map((userId) => getUserNickname(userId)).join(', ')
                      } else {
                        displayText = `${friendViewing.slice(0, 2).map((userId) => getUserNickname(userId)).join(', ')} 외 ${friendViewing.length - 2}명`
                      }
                      if (nonFriendCount > 0) {
                        displayText += ` 외 ${nonFriendCount}명`
                      }
                    } else if (nonFriendCount > 0) {
                      displayText = `${nonFriendCount}명`
                    }

                    return (
                      <div style={{ marginBottom: readUsers.length > 0 ? spacing.sm : 0 }}>
                        <span style={{ color: colors.textSecondary }}>{displayText}명이 보고 있습니다</span>
                      </div>
                    )
                  })()}
                  {readUsers.length > 0 && (
                    <div style={{ color: colors.textSecondary }}>
                      <span>{readUsers.length}명이 읽었습니다</span>
                    </div>
                  )}
                </div>
              )}

              <PostCard
                post={currentPost}
                highlightCommentId={commentId}
                onUpdate={async () => {
                  // 포스트 업데이트 후 다시 로드
                  try {
                    await fetchPostById(postId)
                    // 피드도 새로고침하여 목록과 동기화
                    const { usePostStore } = await import('../store/postStore')
                    usePostStore.getState().fetchFeed().catch(console.error)
                  } catch (error) {
                    console.error('포스트 업데이트 실패:', error)
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PostModal
