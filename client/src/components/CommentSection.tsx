import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { useCommentStore } from '../store/commentStore'
import { useAuthStore } from '../store/authStore'
import { useFriendStore } from '../store/friendStore'
import { useNotificationStore } from '../store/notificationStore'
import { socketService } from '../services/socketService'
import { Post, User, Comment } from '../types'
import Button from './Button'
import { spacing, radius, fontSize, fontWeight, colors, shadow, transition } from '../styles/designSystem'

interface CommentSectionProps {
  post: Post
  highlightCommentId?: string
}

const CommentSection = ({ post, highlightCommentId }: CommentSectionProps) => {
  const { user } = useAuthStore()
  const {
    commentsByPostId,
    loading,
    error,
    fetchComments,
    createComment,
    updateComment,
    deleteComment,
    addCommentFromSocket,
    addReplyFromSocket,
  } = useCommentStore()
  const { addNotificationFromSocket } = useNotificationStore()
  const { friends } = useFriendStore()

  const [commentContent, setCommentContent] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState<{ [commentId: string]: string }>({})
  const [showReplies, setShowReplies] = useState<{ [commentId: string]: boolean }>({})
  
  // 댓글/답글 좋아요 상태
  const [commentLikes, setCommentLikes] = useState<{ [commentId: string]: { liked: boolean; count: number } }>({})
  
  // @ 태그 관련 상태
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionSuggestions, setMentionSuggestions] = useState<User[]>([])
  const [showMentions, setShowMentions] = useState(false)
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 })
  const [activeInputType, setActiveInputType] = useState<'comment' | 'reply' | null>(null)
  const [activeParentId, setActiveParentId] = useState<string | null>(null)
  const commentInputRef = useRef<HTMLInputElement>(null)
  const replyInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  
  // Typing Indicator 상태 (Phase 5, Phase 6: UI 개선)
  const [typingUsers, setTypingUsers] = useState<{ [postId: string]: Set<string> }>({})
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const replyTypingTimeoutRefs = useRef<{ [commentId: string]: NodeJS.Timeout | null }>({})

  // userId를 닉네임으로 변환하는 헬퍼 함수 (Phase 6)
  const getUserNickname = (userId: string): string => {
    // 친구 목록에서 찾기
    const friend = friends.find((f) => f._id === userId)
    if (friend) {
      return friend.nickname
    }
    
    // 댓글 작성자 확인
    const comment = comments.find((c) => 
      (typeof c.author === 'object' && c.author._id === userId) ||
      (typeof c.author === 'string' && c.author === userId)
    )
    if (comment && typeof comment.author === 'object') {
      return comment.author.nickname
    }
    
    // 찾을 수 없으면 기본값
    return '사용자'
  }

  // 모바일 여부 감지
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const comments = commentsByPostId[post._id] || []

  useEffect(() => {
    // 댓글 섹션이 열릴 때만 댓글 목록 불러오기
    if (post._id) {
      fetchComments(post._id)
    }
  }, [post._id, fetchComments])

  // Typing Indicator: 다른 사용자의 타이핑 상태 수신 (Phase 5)
  useEffect(() => {
    if (!socketService.isConnected() || !post._id) {
      return
    }

    const handleTypingUpdate = (data: { postId: string; userId: string; isTyping: boolean }) => {
      // 자신의 타이핑 상태는 무시
      if (data.userId === user?._id) {
        return
      }

      // 해당 포스트의 타이핑 상태만 처리
      if (data.postId !== post._id) {
        return
      }

      setTypingUsers((prev) => {
        const postTyping = prev[post._id] || new Set<string>()
        const newPostTyping = new Set(postTyping)

        if (data.isTyping) {
          newPostTyping.add(data.userId)
        } else {
          newPostTyping.delete(data.userId)
        }

        return {
          ...prev,
          [post._id]: newPostTyping,
        }
      })
    }

    socketService.on('comment:typing:update', handleTypingUpdate)

    return () => {
      socketService.off('comment:typing:update', handleTypingUpdate)
      // cleanup typing state
      setTypingUsers((prev) => {
        const newState = { ...prev }
        delete newState[post._id]
        return newState
      })
    }
  }, [post._id, user?._id])

  // Socket.IO 이벤트 리스너
  useEffect(() => {
    if (!socketService.isConnected()) {
      return
    }

    const handleCommentNew = (data: any) => {
      // 자신이 작성한 댓글은 무시 (optimistic update로 이미 추가됨)
      if (data.author._id === user?._id) {
        return
      }

      // 포스트 ID 확인
      if (data.postId !== post._id) {
        return
      }

      // 댓글 데이터를 Comment 형식으로 변환
      const newComment: Comment = {
        _id: data.commentId,
        author: data.author,
        content: data.content,
        parentComment: null,
        depth: 0,
        replies: [],
        createdAt: data.createdAt,
        updatedAt: data.createdAt,
      }

      addCommentFromSocket(post._id, newComment)
      
      // 스크롤 동작: 사용자가 하단에 있으면 자동 스크롤
      setTimeout(() => {
        const commentSection = document.getElementById(`comment-section-${post._id}`)
        if (commentSection) {
          const isAtBottom = 
            commentSection.scrollHeight - commentSection.scrollTop <= commentSection.clientHeight + 100
          if (isAtBottom) {
            commentSection.scrollTo({
              top: commentSection.scrollHeight,
              behavior: 'smooth',
            })
          }
        }
      }, 100)
    }

    const handleReplyNew = (data: any) => {
      // 자신이 작성한 답글은 무시
      if (data.author._id === user?._id) {
        return
      }

      // 포스트 ID 확인
      if (data.postId !== post._id) {
        return
      }

      if (!data.parentCommentId) {
        return
      }

      // 답글 데이터를 Comment 형식으로 변환
      const newReply: Comment = {
        _id: data.commentId,
        author: data.author,
        content: data.content,
        parentComment: data.parentCommentId,
        depth: 1,
        createdAt: data.createdAt,
        updatedAt: data.createdAt,
      }

      addReplyFromSocket(post._id, data.parentCommentId, newReply)
      
      // 부모 스레드 자동 확장
      setShowReplies((prev) => ({
        ...prev,
        [data.parentCommentId]: true,
      }))
      
      // 스크롤 동작: 사용자가 하단에 있으면 자동 스크롤
      setTimeout(() => {
        const commentSection = document.getElementById(`comment-section-${post._id}`)
        if (commentSection) {
          const isAtBottom = 
            commentSection.scrollHeight - commentSection.scrollTop <= commentSection.clientHeight + 100
          if (isAtBottom) {
            const replyElement = document.getElementById(`comment-${data.commentId}`)
            if (replyElement) {
              replyElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
            }
          }
        }
      }, 100)
    }

    socketService.on('comment:new', handleCommentNew)
    socketService.on('reply:new', handleReplyNew)

    return () => {
      socketService.off('comment:new', handleCommentNew)
      socketService.off('reply:new', handleReplyNew)
    }
  }, [post._id, user?._id, addCommentFromSocket, addReplyFromSocket])

  // 친구 목록 불러오기 (태그 기능을 위해)
  useEffect(() => {
    if (user && friends.length === 0) {
      useFriendStore.getState().fetchFriends()
    }
  }, [user, friends.length])

  // 댓글 좋아요 상태 초기화
  useEffect(() => {
    if (comments && user) {
      const likesMap: { [commentId: string]: { liked: boolean; count: number } } = {}
      const processComment = (comment: Comment) => {
        const likes = (comment.likes as string[]) || []
        const isLiked = likes.includes(user._id)
        likesMap[comment._id] = {
          liked: isLiked,
          count: likes.length,
        }
        // 답글도 처리
        if (comment.replies) {
          comment.replies.forEach((reply) => {
            const replyLikes = (reply.likes as string[]) || []
            const replyIsLiked = replyLikes.includes(user._id)
            likesMap[reply._id] = {
              liked: replyIsLiked,
              count: replyLikes.length,
            }
          })
        }
      }
      comments.forEach(processComment)
      setCommentLikes(likesMap)
    }
  }, [comments, user])

  // highlightCommentId가 있으면 해당 댓글로 스크롤 및 하이라이트
  useLayoutEffect(() => {
    if (!highlightCommentId || comments.length === 0 || loading) {
      return
    }

    // DOM이 렌더링될 때까지 대기
    const attemptScroll = (retries = 10) => {
      const commentElement = document.getElementById(`comment-${highlightCommentId}`)
      
      if (commentElement) {
        // 답글인 경우 부모 스레드 자동 확장
        const reply = comments
          .flatMap((c) => (c.replies || []).map((r) => ({ ...r, parentId: c._id })))
          .find((r) => r._id === highlightCommentId)
        
        if (reply) {
          // 부모 스레드 자동 확장
          setShowReplies((prev) => ({
            ...prev,
            [reply.parentId]: true,
          }))
          
          // 확장 후 DOM 업데이트 대기
          setTimeout(() => {
            const updatedElement = document.getElementById(`comment-${highlightCommentId}`)
            if (updatedElement) {
              scrollAndHighlight(updatedElement)
            } else {
              // 댓글이 삭제되었을 수 있음
              console.warn(`댓글 ${highlightCommentId}를 찾을 수 없습니다. 삭제되었을 수 있습니다.`)
            }
          }, 100)
        } else {
          // 일반 댓글인 경우 부모 댓글 확인
          const parentComment = comments.find((c) => c._id === highlightCommentId)
          if (parentComment) {
            scrollAndHighlight(commentElement)
          } else {
            // 댓글이 삭제되었을 수 있음
            console.warn(`댓글 ${highlightCommentId}를 찾을 수 없습니다. 삭제되었을 수 있습니다.`)
          }
        }
      } else if (retries > 0) {
        // DOM이 아직 준비되지 않았으면 재시도
        setTimeout(() => attemptScroll(retries - 1), 100)
      } else {
        // 최대 재시도 횟수 초과 - 댓글이 삭제되었거나 권한이 없을 수 있음
        console.warn(`댓글 ${highlightCommentId}를 찾을 수 없습니다. 삭제되었거나 접근 권한이 없을 수 있습니다.`)
      }
    }

    const scrollAndHighlight = (element: HTMLElement) => {
      // 모바일에서 키보드가 열려있을 수 있으므로 약간의 여유 공간 확보
      const scrollOffset = isMobile ? 100 : 0
      
      // 스크롤 (모바일 고려)
      if (isMobile) {
        const elementTop = element.getBoundingClientRect().top + window.pageYOffset - scrollOffset
        window.scrollTo({ top: elementTop, behavior: 'smooth' })
      } else {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      
      // 하이라이트 효과 (배경색 + scale)
      element.style.backgroundColor = '#FFE082'
      element.style.transform = 'scale(1.02)'
      element.style.transition = 'background-color 0.3s, transform 0.3s'
      
      // 3초 후 페이드아웃
      setTimeout(() => {
        element.style.backgroundColor = '#FFF9E6'
        element.style.transform = 'scale(1)'
        
        // 2초 후 원래대로
        setTimeout(() => {
          element.style.backgroundColor = ''
          element.style.transform = ''
        }, 2000)
      }, 3000)
    }

    attemptScroll()
  }, [highlightCommentId, comments, loading, isMobile])

  // @ 태그 감지 및 친구 필터링
  const handleMentionDetection = (
    value: string,
    cursorPos: number,
    inputType: 'comment' | 'reply',
    parentId?: string
  ) => {
    const textBeforeCursor = value.substring(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
      const spaceIndex = textAfterAt.indexOf(' ')
      const newlineIndex = textAfterAt.indexOf('\n')

      if (spaceIndex === -1 && newlineIndex === -1) {
        // @ 뒤에 공백이나 줄바꿈이 없으면 태그 모드
        const query = textAfterAt.toLowerCase()
        setMentionQuery(query)
        setActiveInputType(inputType)
        setActiveParentId(parentId || null)

        // 친구 필터링
        const filtered = friends.filter(
          (friend) =>
            friend.nickname.toLowerCase().includes(query) ||
            friend.id.toLowerCase().includes(query)
        )
        setMentionSuggestions(filtered.slice(0, 7)) // 최대 7개

        // 드롭다운 위치 계산
        const inputElement =
          inputType === 'comment'
            ? commentInputRef.current
            : replyInputRefs.current[parentId || '']
        if (inputElement) {
          const rect = inputElement.getBoundingClientRect()
          setMentionPosition({
            top: rect.bottom + window.scrollY + 5,
            left: rect.left + window.scrollX,
          })
        }
        setShowMentions(true)
      } else {
        setShowMentions(false)
      }
    } else {
      setShowMentions(false)
    }
  }

  // 태그 삽입
  const insertMention = (friend: User, inputType: 'comment' | 'reply', parentId?: string) => {
    const currentContent =
      inputType === 'comment' ? commentContent : replyContent[parentId || ''] || ''
    const cursorPos =
      inputType === 'comment'
        ? commentInputRef.current?.selectionStart || 0
        : replyInputRefs.current[parentId || '']?.selectionStart || 0

    const textBeforeCursor = currentContent.substring(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    const textAfterCursor = currentContent.substring(cursorPos)

    const beforeAt = currentContent.substring(0, lastAtIndex + 1)
    const afterQuery = currentContent.substring(cursorPos)
    const newContent = `${beforeAt}${friend.nickname} ${afterQuery}`

    if (inputType === 'comment') {
      setCommentContent(newContent)
      setTimeout(() => {
        const newCursorPos = lastAtIndex + 1 + friend.nickname.length + 1
        commentInputRef.current?.setSelectionRange(newCursorPos, newCursorPos)
        commentInputRef.current?.focus()
      }, 0)
    } else {
      setReplyContent((prev) => ({
        ...prev,
        [parentId || '']: newContent,
      }))
      setTimeout(() => {
        const newCursorPos = lastAtIndex + 1 + friend.nickname.length + 1
        replyInputRefs.current[parentId || '']?.setSelectionRange(newCursorPos, newCursorPos)
        replyInputRefs.current[parentId || '']?.focus()
      }, 0)
    }

    setShowMentions(false)
  }

  // content에서 @태그된 사용자 ID 추출
  const extractMentions = (content: string): string[] => {
    const mentionRegex = /@(\w+)/g
    const mentions: string[] = []
    const matches = content.matchAll(mentionRegex)
    
    for (const match of matches) {
      const mentionText = match[1]
      // 친구 목록에서 닉네임 또는 ID로 찾기
      const friend = friends.find(
        (f) => f.nickname === mentionText || f.id === mentionText
      )
      if (friend) {
        mentions.push(friend._id)
      }
    }
    
    // 중복 제거
    return [...new Set(mentions)]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentContent.trim()) return

    try {
      const mentions = extractMentions(commentContent)
      await createComment(post._id, {
        content: commentContent.trim(),
        mentions,
      })
      setCommentContent('')
      setShowMentions(false)
      
      // Typing Indicator: 댓글 제출 시 입력 종료 (Phase 5)
      if (socketService.isConnected()) {
        const socket = socketService.getSocket()
        if (socket) {
          socket.emit('comment:typing:end', { postId: post._id })
        }
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
          typingTimeoutRef.current = null
        }
      }
    } catch (error) {
      console.error('댓글 작성 실패:', error)
    }
  }

  const handleReplySubmit = async (parentCommentId: string) => {
    const content = replyContent[parentCommentId]?.trim()
    if (!content) return

    try {
      const mentions = extractMentions(content)
      await createComment(post._id, {
        content: content.trim(),
        parentCommentId,
        mentions,
      })
      // 답글 작성 후 입력창 내용만 초기화 (입력창은 유지)
      setReplyContent((prev) => ({
        ...prev,
        [parentCommentId]: '',
      }))
      setShowMentions(false)
      // 답글 작성 후 자동으로 답글 목록 표시
      setShowReplies((prev) => ({
        ...prev,
        [parentCommentId]: true,
      }))
      
      // Typing Indicator: 답글 제출 시 입력 종료 (Phase 5)
      if (socketService.isConnected()) {
        const socket = socketService.getSocket()
        if (socket) {
          socket.emit('comment:typing:end', { postId: post._id })
        }
        if (replyTypingTimeoutRefs.current[parentCommentId]) {
          clearTimeout(replyTypingTimeoutRefs.current[parentCommentId]!)
          replyTypingTimeoutRefs.current[parentCommentId] = null
        }
      }
    } catch (error) {
      console.error('답글 작성 실패:', error)
    }
  }

  const handleUpdate = async (commentId: string) => {
    if (!editingContent.trim()) return

    try {
      await updateComment(post._id, commentId, editingContent.trim())
      setEditingCommentId(null)
      setEditingContent('')
    } catch (error) {
      console.error('댓글 수정 실패:', error)
    }
  }

  // 댓글/답글 좋아요 핸들러
  const handleCommentLike = async (commentId: string) => {
    if (!user) return

    try {
      const result = await toggleCommentLike(commentId)
      setCommentLikes((prev) => ({
        ...prev,
        [commentId]: {
          liked: result.liked,
          count: result.count,
        },
      }))
      // 댓글 목록 새로고침 (좋아요 상태 동기화)
      fetchComments(post._id)
    } catch (error) {
      console.error('댓글 좋아요 처리 실패:', error)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return

    try {
      await deleteComment(post._id, commentId)
    } catch (error) {
      console.error('댓글 삭제 실패:', error)
    }
  }

  const startEdit = (comment: any) => {
    setEditingCommentId(comment._id)
    setEditingContent(comment.content)
  }

  const cancelEdit = () => {
    setEditingCommentId(null)
    setEditingContent('')
  }

  return (
    <div
      id={`comment-section-${post._id}`}
      style={{
        marginTop: '1.5rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid rgba(255, 224, 130, 0.3)',
        maxHeight: '600px',
        overflowY: 'auto',
      }}
    >
        {/* Typing Indicator - Phase 7-D: 최소화 */}
        {typingUsers[post._id] && typingUsers[post._id].size > 0 && (
          <div
            aria-live="polite"
            aria-atomic="true"
            style={{
              marginBottom: spacing.sm,
              padding: `${spacing.sm} ${spacing.md}`,
              backgroundColor: colors.backgroundSecondary,
              borderRadius: radius.sm,
              fontSize: fontSize.xs,
              color: colors.textTertiary,
              fontStyle: 'italic',
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: '0.875rem' }}>⌨️</span>
            <span>
              {Array.from(typingUsers[post._id]).length === 1
                ? `${getUserNickname(Array.from(typingUsers[post._id])[0])}님이 입력 중...`
                : Array.from(typingUsers[post._id]).length <= 3
                ? `${Array.from(typingUsers[post._id])
                    .map((userId) => getUserNickname(userId))
                    .join(', ')}님이 입력 중...`
                : `${Array.from(typingUsers[post._id])
                    .slice(0, 2)
                    .map((userId) => getUserNickname(userId))
                    .join(', ')} 외 ${Array.from(typingUsers[post._id]).length - 2}명 입력 중...`}
            </span>
          </div>
        )}

        {/* 댓글 수 표시 - Phase 7-D: 단순화 */}
        <div
          role="status"
          aria-live="polite"
          style={{
            marginBottom: spacing.lg,
            fontSize: fontSize.sm,
            fontWeight: fontWeight.medium,
            color: colors.textSecondary,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
          }}
        >
          <span>
            댓글 {comments.reduce((total, comment) => total + 1 + (comment.replies?.length || 0), 0)}개
          </span>
        </div>

      {/* 댓글 입력 폼 - 모바일 키보드 처리 개선 (Phase 7-C-2) */}
      {user && (
        <form
          onSubmit={handleSubmit}
          style={{
            marginBottom: isMobile ? '0' : '1.5rem',
            position: isMobile ? 'sticky' : 'relative',
            bottom: isMobile ? '0' : 'auto',
            backgroundColor: isMobile ? '#FFFFFF' : 'transparent',
            padding: isMobile ? '0.75rem' : '0',
            paddingBottom: isMobile ? 'calc(0.75rem + env(safe-area-inset-bottom, 0))' : '0',
            paddingTop: isMobile ? '0.75rem' : '0',
            zIndex: isMobile ? 100 : 'auto',
            borderTop: isMobile ? '1px solid rgba(255, 224, 130, 0.3)' : 'none',
            boxShadow: isMobile ? '0 -2px 8px rgba(0, 0, 0, 0.1)' : 'none',
            // 모바일: 키보드가 올라와도 입력창이 보이도록
            ...(isMobile && {
              marginTop: 'auto',
            }),
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <input
              ref={commentInputRef}
              type="text"
              value={commentContent}
              aria-label="댓글 입력"
              placeholder="댓글을 입력하세요..."
              onChange={(e) => {
                setCommentContent(e.target.value)
                const cursorPos = e.target.selectionStart || 0
                handleMentionDetection(e.target.value, cursorPos, 'comment')
                
                // Typing Indicator: 입력 시작 (Phase 5)
                if (socketService.isConnected()) {
                  const socket = socketService.getSocket()
                  if (socket && e.target.value.length > 0) {
                    socket.emit('comment:typing:start', { postId: post._id })
                    
                    // 이전 타임아웃 클리어
                    if (typingTimeoutRef.current) {
                      clearTimeout(typingTimeoutRef.current)
                    }
                    
                    // 3초 후 자동으로 typing:end emit (debounce)
                    typingTimeoutRef.current = setTimeout(() => {
                      if (socketService.isConnected()) {
                        const socket = socketService.getSocket()
                        if (socket) {
                          socket.emit('comment:typing:end', { postId: post._id })
                        }
                      }
                    }, 3000)
                  }
                }
              }}
              onKeyDown={(e) => {
                if (showMentions && mentionSuggestions.length > 0) {
                  if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
                    e.preventDefault()
                    // 키보드 네비게이션은 추후 구현 가능
                  }
                }
              }}
              onSelectionChange={(e) => {
                const target = e.target as HTMLInputElement
                const cursorPos = target.selectionStart || 0
                handleMentionDetection(commentContent, cursorPos, 'comment')
              }}
              placeholder="댓글을 입력하세요... (@로 친구 태그)"
              style={{
                flex: 1,
                padding: isMobile ? `${spacing.sm} ${spacing.md}` : `${spacing.sm} ${spacing.md}`,
                border: `1px solid ${colors.border}`,
                borderRadius: radius.xs,
                fontSize: fontSize.sm, // Instagram 입력창 텍스트 14px
                outline: 'none',
                transition: transition.base,
                backgroundColor: colors.background,
              }}
              onFocus={(e) => {
                e.target.style.borderColor = colors.primary
                const cursorPos = e.target.selectionStart || 0
                handleMentionDetection(commentContent, cursorPos, 'comment')
              }}
              onBlur={(e) => {
                e.target.style.borderColor = colors.border
                // 드롭다운 클릭을 위해 약간의 지연
                setTimeout(() => setShowMentions(false), 200)
                
                // Typing Indicator: 입력 종료 (Phase 5)
                if (socketService.isConnected()) {
                  const socket = socketService.getSocket()
                  if (socket) {
                    socket.emit('comment:typing:end', { postId: post._id })
                  }
                  if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current)
                    typingTimeoutRef.current = null
                  }
                }
              }}
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={loading || !commentContent.trim()}
            >
              작성
            </Button>
          </div>
        </form>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div
          style={{
            padding: '0.75rem',
            marginBottom: '1rem',
            backgroundColor: '#FFEBEE',
            color: '#C62828',
            borderRadius: '8px',
            fontSize: '0.875rem',
            border: '1px solid rgba(239, 83, 80, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>⚠️</span>
          <span>
            {error.includes('403') || error.includes('권한')
              ? '이 댓글을 볼 수 있는 권한이 없습니다.'
              : error.includes('404') || error.includes('찾을 수 없')
              ? '댓글이 삭제되었거나 찾을 수 없습니다.'
              : error}
          </span>
        </div>
      )}

      {/* 댓글 목록 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading && comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#9E9E9E' }}>
            댓글을 불러오는 중...
          </div>
        ) : comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#9E9E9E' }}>
            아직 댓글이 없습니다.
          </div>
        ) : (
          comments.map((comment) => {
            const isAuthor = user?._id === (comment.author as any)?._id
            const isEditing = editingCommentId === comment._id
            const isHighlighted = highlightCommentId === comment._id
            const isReplying = replyingToCommentId === comment._id
            const replies = comment.replies || []

            return (
              <div key={comment._id}>
                {/* 부모 댓글 */}
                {/* 부모 댓글 - Phase 7-D: 리스트 스타일 (카드 제거) */}
                <div
                  id={`comment-${comment._id}`}
                  style={{
                    padding: `${spacing.md} 0`,
                    paddingLeft: isHighlighted ? spacing.md : 0,
                    backgroundColor: isHighlighted ? colors.accentBackground : 'transparent',
                    borderLeft: isHighlighted ? `3px solid ${colors.accent}` : 'none',
                    marginBottom: spacing.lg,
                    transition: transition.slow,
                  }}
                >
                  {isEditing ? (
                    // 수정 모드
                    <div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <input
                          type="text"
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          aria-label="댓글 수정"
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            border: '1px solid rgba(255, 224, 130, 0.5)',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            outline: 'none',
                          }}
                          autoFocus
                        />
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleUpdate(comment._id)}
                          disabled={loading || !editingContent.trim()}
                        >
                          저장
                        </Button>
                        <Button variant="secondary" size="sm" onClick={cancelEdit}>
                          취소
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // 일반 모드
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
                            <span
                              style={{
                                fontWeight: fontWeight.semibold,
                                fontSize: fontSize.sm,
                                color: colors.textPrimary,
                              }}
                            >
                              {(comment.author as any)?.nickname || '익명'}
                            </span>
                            {/* Instagram 스타일: 12px 메타 정보 */}
                            <span
                              style={{
                                fontSize: fontSize.xs,
                                color: colors.textSecondary,
                              }}
                            >
                              {new Date(comment.createdAt).toLocaleString('ko-KR', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          {/* Instagram 스타일: 댓글 본문 14px */}
                          <div
                            style={{
                              fontSize: fontSize.sm, // Instagram 댓글 본문은 14px
                              color: colors.textPrimary,
                              lineHeight: 1.5,
                              whiteSpace: 'pre-wrap',
                            }}
                          >
                            {comment.content.split(/(@\w+)/g).map((part, index) => {
                              if (part.startsWith('@')) {
                                const mentionText = part.substring(1)
                                const friend = friends.find(
                                  (f) => f.nickname === mentionText || f.id === mentionText
                                )
                                if (friend) {
                                  return (
                                    <span
                                      key={index}
                                      style={{
                                        color: colors.primary,
                                        fontWeight: fontWeight.semibold,
                                        cursor: 'pointer',
                                      }}
                                      onMouseEnter={(e) => {
                                        if (!isMobile) {
                                          e.currentTarget.style.textDecoration = 'underline'
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.textDecoration = 'none'
                                      }}
                                    >
                                      {part}
                                    </span>
                                  )
                                }
                              }
                              return <span key={index}>{part}</span>
                            })}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: spacing.md, alignItems: 'center' }}>
                          {/* 댓글 좋아요 버튼 */}
                          <button
                            onClick={() => handleCommentLike(comment._id)}
                            disabled={!user}
                            aria-label={commentLikes[comment._id]?.liked ? `좋아요 취소 (${commentLikes[comment._id]?.count || 0})` : `좋아요 (${commentLikes[comment._id]?.count || 0})`}
                            aria-pressed={commentLikes[comment._id]?.liked || false}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: user ? 'pointer' : 'default',
                              display: 'flex',
                              alignItems: 'center',
                              gap: spacing.xs,
                              padding: `${spacing.xs} ${spacing.sm}`,
                              borderRadius: radius.full,
                              fontSize: fontSize.sm,
                              color: commentLikes[comment._id]?.liked ? colors.error : colors.textTertiary,
                              minHeight: isMobile ? '32px' : 'auto',
                              transition: transition.base,
                            }}
                            onMouseEnter={(e) => {
                              if (user && !isMobile) {
                                e.currentTarget.style.backgroundColor = colors.backgroundSecondary
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isMobile) {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }
                            }}
                          >
                            {/* Instagram 스타일: 작은 아이콘 */}
                            <span style={{ fontSize: '18px', lineHeight: 1 }}>
                              {commentLikes[comment._id]?.liked ? '❤️' : '🤍'}
                            </span>
                            {commentLikes[comment._id] && commentLikes[comment._id].count > 0 && (
                              <span style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>
                                {commentLikes[comment._id].count}
                              </span>
                            )}
                          </button>
                          {isAuthor && (
                            <div style={{ display: 'flex', gap: spacing.sm }}>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => startEdit(comment)}
                                disabled={loading}
                              >
                                수정
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDelete(comment._id)}
                                disabled={loading}
                              >
                                삭제
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* 답글 버튼 - 답글이 있어도 답글 작성 버튼 표시 */}
                {!isEditing && (
                  <div style={{ 
                    marginTop: spacing.sm,
                    marginLeft: isMobile ? spacing.sm : spacing.md,
                    display: 'flex',
                    gap: spacing.md,
                    alignItems: 'center',
                  }}>
                    {replies.length > 0 && (
                      <button
                        onClick={() =>
                          setShowReplies((prev) => ({
                            ...prev,
                            [comment._id]: !prev[comment._id],
                          }))
                        }
                        aria-label={showReplies[comment._id] ? '답글 숨기기' : `답글 ${replies.length}개 보기`}
                        aria-expanded={showReplies[comment._id]}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: colors.textSecondary,
                          cursor: 'pointer',
                          fontSize: fontSize.xs,
                          padding: `${spacing.xs} ${spacing.sm}`,
                          fontWeight: fontWeight.medium,
                          minHeight: isMobile ? '44px' : 'auto',
                        }}
                      >
                        {showReplies[comment._id] ? '답글 숨기기' : `답글 ${replies.length}개 보기`}
                      </button>
                    )}
                    {/* Instagram 스타일: 답글 버튼 */}
                    <button
                      onClick={() => setReplyingToCommentId(comment._id)}
                      aria-label="답글 작성"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: colors.textSecondary,
                        cursor: 'pointer',
                        fontSize: fontSize.xs,
                        padding: `${spacing.xs} ${spacing.sm}`,
                        fontWeight: fontWeight.medium,
                        minHeight: isMobile ? '44px' : 'auto',
                      }}
                    >
                      답글
                    </button>
                  </div>
                )}

                {/* 답글 입력창 - 모바일 depth 표현 및 터치 UX 개선 (Phase 7-C-2) */}
                {!isEditing && isReplying && (
                  <div
                    style={{
                      marginTop: spacing.sm,
                      marginLeft: isMobile ? spacing.md : spacing.xl, // Instagram 스타일: 답글은 살짝 인덴트
                      padding: isMobile ? spacing.sm : spacing.sm,
                      backgroundColor: colors.background,
                      borderRadius: radius.xs,
                      border: `1px solid ${colors.borderLight}`,
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      gap: isMobile ? '0.75rem' : '0.5rem', // 모바일: 터치 타겟 간격 확대
                      alignItems: 'flex-start' 
                    }}>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <input
                          ref={(el) => {
                            replyInputRefs.current[comment._id] = el
                          }}
                          type="text"
                          value={replyContent[comment._id] || ''}
                          aria-label={`${(comment.author as any)?.nickname || '익명'}님에게 답글 입력`}
                          placeholder="답글을 입력하세요..."
                          style={{
                            // 모바일: 입력창 크기 및 패딩 확대
                            ...(isMobile && {
                              padding: '0.875rem 1rem',
                              fontSize: '16px', // iOS 자동 줌 방지
                              minHeight: '44px', // 최소 터치 영역
                            }),
                          }}
                          onChange={(e) => {
                            setReplyContent((prev) => ({
                              ...prev,
                              [comment._id]: e.target.value,
                            }))
                            const cursorPos = e.target.selectionStart || 0
                            handleMentionDetection(e.target.value, cursorPos, 'reply', comment._id)
                            
                            // Typing Indicator: 답글 입력 시작 (Phase 5)
                            if (socketService.isConnected()) {
                              const socket = socketService.getSocket()
                              if (socket && e.target.value.length > 0) {
                                socket.emit('comment:typing:start', { postId: post._id })
                                
                                // 이전 타임아웃 클리어
                                if (replyTypingTimeoutRefs.current[comment._id]) {
                                  clearTimeout(replyTypingTimeoutRefs.current[comment._id]!)
                                }
                                
                                // 3초 후 자동으로 typing:end emit (debounce)
                                replyTypingTimeoutRefs.current[comment._id] = setTimeout(() => {
                                  if (socketService.isConnected()) {
                                    const socket = socketService.getSocket()
                                    if (socket) {
                                      socket.emit('comment:typing:end', { postId: post._id })
                                    }
                                  }
                                }, 3000)
                              }
                            }
                          }}
                          onKeyDown={(e) => {
                            if (showMentions && mentionSuggestions.length > 0 && activeParentId === comment._id) {
                              if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
                                e.preventDefault()
                              }
                            } else if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              handleReplySubmit(comment._id)
                            }
                          }}
                          onSelectionChange={(e) => {
                            const target = e.target as HTMLInputElement
                            const cursorPos = target.selectionStart || 0
                            handleMentionDetection(
                              replyContent[comment._id] || '',
                              cursorPos,
                              'reply',
                              comment._id
                            )
                          }}
                          placeholder="답글을 입력하세요... (@로 친구 태그)"
                          style={{
                            width: '100%',
                            padding: isMobile ? '0.875rem 1rem' : '0.5rem', // 모바일: 패딩 확대
                            border: '1px solid rgba(255, 224, 130, 0.5)',
                            borderRadius: '8px',
                            fontSize: isMobile ? '16px' : '0.875rem', // 모바일: iOS 자동 줌 방지
                            outline: 'none',
                            minHeight: isMobile ? '44px' : 'auto', // 모바일: 최소 터치 영역
                          }}
                          onFocus={(e) => {
                            const cursorPos = e.target.selectionStart || 0
                            handleMentionDetection(
                              replyContent[comment._id] || '',
                              cursorPos,
                              'reply',
                              comment._id
                            )
                          }}
                          onBlur={(e) => {
                            setTimeout(() => {
                              if (activeParentId === comment._id) {
                                setShowMentions(false)
                              }
                            }, 200)
                            
                            // Typing Indicator: 답글 입력 종료 (Phase 5)
                            if (socketService.isConnected()) {
                              const socket = socketService.getSocket()
                              if (socket) {
                                socket.emit('comment:typing:end', { postId: post._id })
                              }
                              if (replyTypingTimeoutRefs.current[comment._id]) {
                                clearTimeout(replyTypingTimeoutRefs.current[comment._id]!)
                                replyTypingTimeoutRefs.current[comment._id] = null
                              }
                            }
                          }}
                        />
                        
                        {/* 답글용 @ 태그 자동완성 드롭다운 */}
                        {showMentions &&
                          activeInputType === 'reply' &&
                          activeParentId === comment._id &&
                          mentionSuggestions.length > 0 && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                width: '300px',
                                maxHeight: '200px',
                                backgroundColor: '#FFFFFF',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                border: '1px solid rgba(255, 224, 130, 0.3)',
                                zIndex: 1000,
                                overflowY: 'auto',
                                marginTop: '0.5rem',
                              }}
                            >
                              {mentionSuggestions.map((friend) => (
                                <div
                                  key={friend._id}
                                  onClick={() => insertMention(friend, 'reply', comment._id)}
                                  style={{
                                    padding: '0.75rem',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid rgba(255, 224, 130, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    transition: 'background-color 0.2s',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#FFF9E6'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#FFFFFF'
                                  }}
                                >
                                  <div
                                    style={{
                                      width: '32px',
                                      height: '32px',
                                      borderRadius: '50%',
                                      background: 'linear-gradient(135deg, #66BB6A 0%, #388E3C 100%)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: 'white',
                                      fontWeight: 'bold',
                                      fontSize: '0.875rem',
                                    }}
                                  >
                                    {friend.nickname[0] || 'U'}
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#212121' }}>
                                      {friend.nickname}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#9E9E9E' }}>{friend.id}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleReplySubmit(comment._id)}
                        disabled={loading || !replyContent[comment._id]?.trim()}
                      >
                        작성
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setReplyingToCommentId(null)
                          setReplyContent((prev) => {
                            const newState = { ...prev }
                            delete newState[comment._id]
                            return newState
                          })
                        }}
                      >
                        취소
                      </Button>
                    </div>
                  </div>
                )}

                {/* 답글 목록 - Phase 7-D: 인덴트만으로 depth 표현 (카드/색 블록 제거) */}
                {replies.length > 0 && showReplies[comment._id] && (
                  <div style={{ 
                    marginTop: spacing.md,
                    marginLeft: spacing.xl, // 답글 인덴트
                    paddingLeft: spacing.md,
                    borderLeft: `2px solid ${colors.dividerLight}`, // 답글 구분선
                  }}>
                    {replies.map((reply) => {
                      const isReplyAuthor = user?._id === (reply.author as any)?._id
                      const isReplyEditing = editingCommentId === reply._id
                      const isReplyHighlighted = highlightCommentId === reply._id

                      return (
                        <div
                          key={reply._id}
                          id={`comment-${reply._id}`}
                          style={{
                            marginBottom: spacing.lg,
                            padding: `${spacing.md} 0`,
                            backgroundColor: isReplyHighlighted ? colors.accentBackground : 'transparent',
                            borderLeft: isReplyHighlighted ? `3px solid ${colors.accent}` : 'none',
                            paddingLeft: isReplyHighlighted ? spacing.md : 0,
                            fontSize: fontSize.sm,
                            transition: transition.slow,
                          }}
                        >
                          {isReplyEditing ? (
                            // 답글 수정 모드
                            <div>
                              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <input
                                  type="text"
                                  value={editingContent}
                                  onChange={(e) => setEditingContent(e.target.value)}
                                  style={{
                                    flex: 1,
                                    padding: '0.5rem',
                                    border: '1px solid rgba(255, 224, 130, 0.5)',
                                    borderRadius: '8px',
                                    fontSize: '0.875rem',
                                    outline: 'none',
                                  }}
                                  autoFocus
                                />
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleUpdate(reply._id)}
                                  disabled={loading || !editingContent.trim()}
                                >
                                  저장
                                </Button>
                                <Button variant="secondary" size="sm" onClick={cancelEdit}>
                                  취소
                                </Button>
                              </div>
                            </div>
                          ) : (
                            // 답글 일반 모드
                            <>
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'flex-start',
                                  marginBottom: '0.5rem',
                                }}
                              >
                                <div style={{ flex: 1 }}>
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: spacing.sm,
                                      marginBottom: spacing.xs,
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontWeight: fontWeight.semibold,
                                        fontSize: fontSize.sm,
                                        color: colors.textPrimary,
                                      }}
                                    >
                                      {(reply.author as any)?.nickname || '익명'}
                                    </span>
                                    {/* Instagram 스타일: 12px 메타 정보 */}
                                    <span style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>
                                      {new Date(reply.createdAt).toLocaleString('ko-KR', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                  {/* Instagram 스타일: 답글 본문 14px */}
                                  <div
                                    style={{
                                      fontSize: fontSize.sm, // Instagram 답글 본문도 14px
                                      color: colors.textPrimary,
                                      lineHeight: 1.5,
                                      whiteSpace: 'pre-wrap',
                                    }}
                                  >
                                    {reply.content.split(/(@\w+)/g).map((part, index) => {
                                      if (part.startsWith('@')) {
                                        const mentionText = part.substring(1)
                                        const friend = friends.find(
                                          (f) => f.nickname === mentionText || f.id === mentionText
                                        )
                                        if (friend) {
                                          return (
                                            <span
                                              key={index}
                                              style={{
                                                color: colors.primary,
                                                fontWeight: fontWeight.semibold,
                                                cursor: 'pointer',
                                              }}
                                              onMouseEnter={(e) => {
                                                e.currentTarget.style.textDecoration = 'underline'
                                              }}
                                              onMouseLeave={(e) => {
                                                e.currentTarget.style.textDecoration = 'none'
                                              }}
                                            >
                                              {part}
                                            </span>
                                          )
                                        }
                                      }
                                      return <span key={index}>{part}</span>
                                    })}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: spacing.md, alignItems: 'center' }}>
                                  {/* 답글 좋아요 버튼 */}
                                  <button
                                    onClick={() => handleCommentLike(reply._id)}
                                    disabled={!user}
                                    aria-label={commentLikes[reply._id]?.liked ? `좋아요 취소 (${commentLikes[reply._id]?.count || 0})` : `좋아요 (${commentLikes[reply._id]?.count || 0})`}
                                    aria-pressed={commentLikes[reply._id]?.liked || false}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      cursor: user ? 'pointer' : 'default',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: spacing.xs,
                                      padding: `${spacing.xs} ${spacing.sm}`,
                                      borderRadius: radius.full,
                                      fontSize: fontSize.xs,
                                      color: commentLikes[reply._id]?.liked ? colors.error : colors.textSecondary,
                                      minHeight: isMobile ? '32px' : 'auto',
                                      transition: transition.base,
                                    }}
                                    onMouseEnter={(e) => {
                                      if (user && !isMobile) {
                                        e.currentTarget.style.backgroundColor = colors.backgroundSecondary
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!isMobile) {
                                        e.currentTarget.style.backgroundColor = 'transparent'
                                      }
                                    }}
                                  >
                                    {/* Instagram 스타일: 작은 아이콘 */}
                                    <span style={{ fontSize: '18px', lineHeight: 1 }}>
                                      {commentLikes[reply._id]?.liked ? '❤️' : '🤍'}
                                    </span>
                                    {commentLikes[reply._id] && commentLikes[reply._id].count > 0 && (
                                      <span style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>
                                        {commentLikes[reply._id].count}
                                      </span>
                                    )}
                                  </button>
                                  {isReplyAuthor && (
                                    <div style={{ display: 'flex', gap: spacing.sm }}>
                                      <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => startEdit(reply)}
                                        disabled={loading}
                                      >
                                        수정
                                      </Button>
                                      <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => handleDelete(reply._id)}
                                        disabled={loading}
                                      >
                                        삭제
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default CommentSection
