import { useEffect } from 'react'
import { useFriendStore } from '../store/friendStore'
import FriendCard from './FriendCard'
import Card from './Card'
import Button from './Button'

const FriendRecommendations = () => {
  const { recommendations, loading, error, fetchRecommendations } = useFriendStore()

  useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#66BB6A' }}>
          추천 친구를 불러오는 중...
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#FFEBEE',
            color: '#C62828',
            borderRadius: '12px',
            marginBottom: '1rem',
          }}
        >
          {error}
        </div>
        <Button onClick={fetchRecommendations}>다시 시도</Button>
      </Card>
    )
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#9E9E9E' }}>
          추천할 친구가 없습니다.
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <h3
        style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, #66BB6A 0%, #FFB300 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        👥 추천 친구
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {recommendations.map((user) => (
          <FriendCard key={user._id} user={user} showRequestButton={true} />
        ))}
      </div>
    </Card>
  )
}

export default FriendRecommendations
