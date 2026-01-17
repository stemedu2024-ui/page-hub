import { useEffect, useRef, useState } from 'react'
import { usePostStore } from '../store/postStore'
import { useAuthStore } from '../store/authStore'
import PostCard from '../components/PostCard'
import PostModal from '../components/PostModal'
import Button from '../components/Button'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { colors, spacing, fontSize, fontWeight, radius } from '../styles/designSystem'

const FeedPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const postRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const { posts, loading, error, fetchFeed, clearError } = usePostStore()
  const { isAuthenticated } = useAuthStore()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  // 모바일 여부 감지
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    // 인증된 상태에서만 피드 로드
    if (isAuthenticated) {
      console.log('📰 FeedPage: 피드 로드 시작')
      fetchFeed().catch((err) => {
        console.error('📰 FeedPage: 피드 로드 실패', err)
      })
    }
  }, [fetchFeed, isAuthenticated])

  // URL 파라미터로 모달 열기 또는 스크롤
  const postId = searchParams.get('postId')
  const commentId = searchParams.get('commentId')

  // 모달 닫기 핸들러
  const handleCloseModal = () => {
    navigate('/feed', { replace: false })
  }

  // postId가 있으면 모달 열기 (스크롤 로직은 비활성화)
  // postId가 없으면 기존 동작 유지

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  return (
    <div
      style={{ 
        maxWidth: isMobile ? '100%' : '614px', // Instagram 피드 너비
        margin: '0 auto', 
        padding: isMobile ? '0' : '20px 0', // Instagram 스타일: 모바일은 padding 0
        backgroundColor: colors.backgroundSecondary, // Instagram 배경색
        minHeight: '100vh',
      }}
      className="fade-in feed-container"
    >
      {/* Instagram 스타일: 타이틀 제거 (Instagram은 타이틀 없음) */}
      {/* 모바일에서는 하단 네비게이션에 작성 버튼이 있으므로 여기서는 생략 가능 */}

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

      {loading && (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#9E9E9E',
            fontSize: '1.125rem',
          }}
        >
          <div style={{ marginBottom: '1rem', fontSize: '2rem' }}>⏳</div>
          로딩 중...
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem',
            background: 'linear-gradient(135deg, #FFF9E6 0%, #FFFFFF 100%)',
            borderRadius: '16px',
            border: '2px solid rgba(255, 224, 130, 0.3)',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
          <h3 style={{ color: '#388E3C', marginBottom: '0.5rem', fontSize: '1.25rem' }}>
            피드가 비어있습니다
          </h3>
          <p style={{ color: '#9E9E9E', marginBottom: '1.5rem' }}>
            첫 포스트를 작성해보세요!
          </p>
          <Button onClick={() => navigate('/posts/create')}>포스트 작성하기</Button>
        </div>
      )}

      {!loading && posts.length > 0 && (
        <div>
          {posts.map((post) => (
            <div
              key={post._id}
              ref={(el) => {
                postRefs.current[post._id] = el
              }}
            >
              <PostCard 
                post={post} 
                onUpdate={fetchFeed}
                highlightCommentId={postId === post._id ? commentId || undefined : undefined}
              />
            </div>
          ))}
        </div>
      )}

      {/* PostModal */}
      {postId && (
        <PostModal
          postId={postId}
          commentId={commentId || undefined}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}

export default FeedPage
