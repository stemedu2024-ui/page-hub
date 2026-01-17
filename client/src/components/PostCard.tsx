import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Post } from '../types'
import { useAuthStore } from '../store/authStore'
import { usePostStore } from '../store/postStore'
import { useLikeStore } from '../store/likeStore'
import { useCommentStore } from '../store/commentStore'
import Button from './Button'
import Card from './Card'
import CommentSection from './CommentSection'
import { spacing, radius, fontSize, fontWeight, colors, shadow, transition } from '../styles/designSystem'

interface PostCardProps {
  post: Post
  onUpdate?: () => void
  highlightCommentId?: string
}

const PostCard = ({ post, onUpdate, highlightCommentId }: PostCardProps) => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { deletePost, loading } = usePostStore()
  const { likesByPostId, fetchLikeStatus, toggleLike, loading: likeLoading } = useLikeStore()
  const { commentsByPostId } = useCommentStore()
  const [isCommentOpen, setIsCommentOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  // 모바일 여부 감지 (Phase 7-C-2)
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 포스트 본문 클릭 시 모달 열기
  const handlePostClick = (e: React.MouseEvent) => {
    // 버튼이나 링크 클릭 시에는 모달을 열지 않음
    const target = e.target as HTMLElement
    if (
      target.tagName === 'BUTTON' ||
      target.tagName === 'A' ||
      target.closest('button') ||
      target.closest('a') ||
      target.closest('[role="button"]')
    ) {
      return
    }
    navigate(`/feed?postId=${post._id}`)
  }

  // highlightCommentId가 있으면 댓글 섹션 자동 열기
  useEffect(() => {
    if (highlightCommentId) {
      setIsCommentOpen(true)
    }
  }, [highlightCommentId])
  
  // author가 객체인지 문자열인지 확인
  const authorId = typeof post.author === 'string' 
    ? post.author 
    : (post.author as any)?._id || (post.author as any)?.id || ''
  const authorNickname = typeof post.author === 'object' && post.author?.nickname
    ? post.author.nickname
    : '익명'
  const isAuthor = user?._id === authorId

  // 좋아요 상태 조회
  useEffect(() => {
    if (user) {
      fetchLikeStatus(post._id)
    }
  }, [post._id, user, fetchLikeStatus])

  // 좋아요 상태 (스토어에 없으면 포스트 데이터에서 초기화)
  const likeStatus = likesByPostId[post._id] || {
    count: Array.isArray(post.likes) ? post.likes.length : 0,
    liked: Array.isArray(post.likes) && user ? post.likes.includes(user._id) : false,
  }

  // 댓글 개수 (댓글 + 답글 합산)
  const comments = commentsByPostId[post._id] || []
  const commentCount = comments.reduce(
    (total, comment) => total + 1 + (comment.replies?.length || 0),
    0
  ) || post.commentCount || 0

  const handleLikeClick = async () => {
    if (!user) return
    try {
      await toggleLike(post._id)
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('좋아요 처리 실패:', error)
    }
  }

  const handleCommentClick = () => {
    setIsCommentOpen(!isCommentOpen)
  }

  const handleDelete = async () => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        await deletePost(post._id)
        if (onUpdate) onUpdate()
      } catch (error) {
        console.error('Delete error:', error)
      }
    }
  }

  const getVisibilityLabel = (visibility: string) => {
    const labels: Record<string, string> = {
      private: '나만',
      friends: '친구만',
      teachers: '선생님만',
      friends_teachers: '친구+선생님',
      public: '전체',
    }
    return labels[visibility] || visibility
  }

  const getQuestionStatusBadge = () => {
    if (post.type !== 'question' || !post.questionStatus) return null

    return (
      <span
        style={{
          display: 'inline-block',
          padding: `${spacing.xs} ${spacing.sm}`,
          borderRadius: radius.xs,
          fontSize: fontSize.xs,
          fontWeight: fontWeight.medium,
          backgroundColor: post.questionStatus === 'answered' ? colors.successLight : colors.warningLight,
          color: post.questionStatus === 'answered' ? colors.success : colors.warning,
        }}
      >
        {post.questionStatus === 'answered' ? '✅ 답변 완료' : '⏳ 답변 대기'}
      </span>
    )
  }

  return (
    <Card style={{ marginBottom: isMobile ? spacing.md : spacing.lg, padding: isMobile ? spacing.sm : spacing.md }} className="post-card">
      {/* 클릭 가능한 영역: 프로필, 제목, 본문 */}
      <div
        onClick={handlePostClick}
        style={{
          cursor: 'pointer',
        }}
      >
        {/* Instagram 스타일: 프로필 헤더 */}
        <div style={{ marginBottom: spacing.md, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            {/* Instagram 스타일: 32px 프로필 이미지 */}
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: radius.full,
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: fontWeight.semibold,
                fontSize: fontSize.sm,
                flexShrink: 0,
              }}
            >
              {authorNickname[0] || 'U'}
            </div>
            <div style={{ minWidth: 0 }}>
              {/* Instagram 스타일: 14px 닉네임 */}
              <div style={{ fontWeight: fontWeight.semibold, fontSize: fontSize.sm, color: colors.textPrimary, lineHeight: 1.2 }}>
                {authorNickname}
              </div>
              {/* Instagram 스타일: 12px 메타 정보 */}
              <div style={{ fontSize: fontSize.xs, color: colors.textSecondary, lineHeight: 1.2, marginTop: '2px' }}>
                {new Date(post.createdAt).toLocaleString('ko-KR', { 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
          {/* Instagram 스타일: 작은 뱃지 */}
          <div style={{ display: 'flex', gap: spacing.xs, alignItems: 'center', flexShrink: 0 }}>
            <span
              style={{
                fontSize: fontSize.xs,
                color: colors.textSecondary,
                background: colors.backgroundSecondary,
                padding: `${spacing.xs} ${spacing.sm}`,
                borderRadius: radius.xs,
                fontWeight: fontWeight.medium,
              }}
            >
              {getVisibilityLabel(post.visibility)}
            </span>
            {post.type === 'question' && getQuestionStatusBadge()}
          </div>
        </div>

        {/* Instagram 스타일: 제목 (최소화) */}
        {post.type === 'question' && post.title && (
          <h3
            style={{
              marginBottom: spacing.sm,
              fontSize: fontSize.base,
              fontWeight: fontWeight.semibold,
              color: colors.textPrimary,
              lineHeight: 1.4,
            }}
          >
            {post.title}
          </h3>
        )}

        {/* Instagram 스타일: 본문 - 14px, 간결한 여백 */}
        <div
          style={{
            marginBottom: spacing.sm,
            whiteSpace: 'pre-wrap',
            lineHeight: 1.5,
            color: colors.textPrimary,
            fontSize: fontSize.sm, // Instagram 본문은 14px
            wordBreak: 'break-word',
          }}
        >
          {post.content}
        </div>
      </div>

      {/* Instagram 스타일: 이미지 (전체 너비) */}
      {post.images && post.images.length > 0 && (
        <div style={{ marginBottom: spacing.sm, width: '100%' }}>
          {post.images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`첨부 ${index + 1}`}
              style={{
                width: '100%',
                maxHeight: isMobile ? '400px' : '500px',
                objectFit: 'cover',
                marginBottom: index < post.images!.length - 1 ? spacing.sm : 0,
              }}
            />
          ))}
        </div>
      )}

      {/* Instagram 스타일: YouTube 링크 (간결하게) */}
      {post.youtubeLink && (
        <div
          style={{
            marginBottom: spacing.sm,
            padding: spacing.sm,
            background: colors.backgroundSecondary,
            borderRadius: radius.xs,
          }}
        >
          <a
            href={post.youtubeLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: colors.primary,
              textDecoration: 'none',
              fontWeight: fontWeight.semibold,
              display: 'inline-flex',
              alignItems: 'center',
              gap: spacing.xs,
              fontSize: fontSize.sm,
            }}
          >
            <span>📺</span>
            <span>YouTube 링크</span>
          </a>
        </div>
      )}

      {/* Instagram 스타일: 좋아요 & 댓글 버튼 (한 줄) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.lg,
          marginTop: spacing.sm,
          paddingTop: spacing.sm,
          borderTop: `1px solid ${colors.divider}`,
        }}
      >
        {/* 좋아요 버튼 - 모바일 터치 UX 개선 (Phase 7-C-2) */}
        {/* aria-label: 스크린리더가 버튼 목적을 인식할 수 있도록 (Phase 7-C-1) */}
        <button
          onClick={handleLikeClick}
          disabled={likeLoading || !user}
          aria-label={likeStatus.liked ? `좋아요 취소 (${likeStatus.count})` : `좋아요 (${likeStatus.count})`}
          aria-pressed={likeStatus.liked}
          style={{
            background: 'none',
            border: 'none',
            cursor: user ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
            padding: isMobile ? `${spacing.sm} ${spacing.md}` : spacing.sm,
            borderRadius: radius.xs,
            transition: transition.base,
            fontSize: fontSize.sm, // Instagram 버튼 텍스트 14px
            color: likeStatus.liked ? colors.error : colors.textPrimary,
            minHeight: isMobile ? '44px' : 'auto',
            WebkitTapHighlightColor: 'transparent',
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
          onTouchStart={(e) => {
            if (user && isMobile) {
              e.currentTarget.style.backgroundColor = colors.backgroundSecondary
              e.currentTarget.style.transform = 'scale(0.95)'
            }
          }}
          onTouchEnd={(e) => {
            if (isMobile) {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.transform = 'scale(1)'
            }
          }}
        >
          {/* Instagram 스타일: 아이콘 24px */}
          <span style={{ fontSize: '24px', lineHeight: 1 }}>
            {likeStatus.liked ? '❤️' : '🤍'}
          </span>
          {likeStatus.count > 0 && (
            <span style={{ fontWeight: fontWeight.normal, fontSize: fontSize.sm }}>
              {likeStatus.count}
            </span>
          )}
        </button>

        {/* Instagram 스타일: 댓글 버튼 */}
        {/* aria-label: 스크린리더가 버튼 목적을 인식할 수 있도록 (Phase 7-C-1) */}
        <button
          onClick={handleCommentClick}
          disabled={!user}
          aria-label={`댓글 ${commentCount}개 ${isCommentOpen ? '숨기기' : '보기'}`}
          aria-expanded={isCommentOpen}
          style={{
            background: 'none',
            border: 'none',
            cursor: user ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
            padding: isMobile ? `${spacing.sm} ${spacing.md}` : spacing.sm,
            borderRadius: radius.xs,
            transition: transition.base,
            fontSize: fontSize.sm,
            color: isCommentOpen ? colors.primary : colors.textPrimary,
            minHeight: isMobile ? '44px' : 'auto',
            WebkitTapHighlightColor: 'transparent',
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
          onTouchStart={(e) => {
            if (user && isMobile) {
              e.currentTarget.style.backgroundColor = colors.backgroundSecondary
              e.currentTarget.style.transform = 'scale(0.95)'
            }
          }}
          onTouchEnd={(e) => {
            if (isMobile) {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.transform = 'scale(1)'
            }
          }}
        >
          <span style={{ fontSize: '24px', lineHeight: 1 }}>💬</span>
          {commentCount > 0 && (
            <span style={{ fontWeight: fontWeight.normal, fontSize: fontSize.sm }}>
              {commentCount}
            </span>
          )}
        </button>
      </div>

      {/* Instagram 스타일: 작성자만 수정/삭제 버튼 표시 */}
      {isAuthor && (
        <div
          style={{
            display: 'flex',
            gap: spacing.sm,
            marginTop: spacing.sm,
            paddingTop: spacing.sm,
            borderTop: `1px solid ${colors.divider}`,
          }}
        >
          <Button
            variant="secondary"
            onClick={() => {
              // 수정 기능은 추후 구현
              alert('수정 기능은 추후 구현 예정입니다.')
            }}
            disabled={loading}
            size="sm"
          >
            수정
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={loading} size="sm">
            삭제
          </Button>
        </div>
      )}

      {/* 댓글 영역 (토글) */}
      {isCommentOpen && <CommentSection post={post} highlightCommentId={highlightCommentId} />}
    </Card>
  )
}

export default PostCard
