import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Card from '../components/Card'
import Button from '../components/Button'

const Home = () => {
  const { isAuthenticated } = useAuthStore()

  return (
    <div
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2rem',
        textAlign: 'center',
      }}
      className="fade-in"
    >
      <div style={{ marginBottom: '3rem' }}>
        <h1
          style={{
            fontSize: '3rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #66BB6A 0%, #FFB300 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '1rem',
          }}
        >
          PageHub에 오신 것을 환영합니다
        </h1>
        <p
          style={{
            fontSize: '1.25rem',
            color: '#9E9E9E',
            marginBottom: '2rem',
          }}
        >
          학생과 선생님을 위한 따뜻한 교육 커뮤니티
        </p>
      </div>

      <Card
        style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF9E6 100%)',
          padding: '3rem',
        }}
      >
        <div style={{ marginBottom: '2rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            <div
              style={{
                textAlign: 'center',
                padding: '1.5rem',
                background: '#E8F5E9',
                borderRadius: '16px',
                flex: '1',
                minWidth: '200px',
              }}
            >
              <div
                style={{
                  fontSize: '2.5rem',
                  marginBottom: '0.5rem',
                }}
              >
                📚
              </div>
              <h3 style={{ color: '#388E3C', marginBottom: '0.5rem' }}>학습 공유</h3>
              <p style={{ fontSize: '0.875rem', color: '#9E9E9E' }}>
                학습 자료와 노하우를 공유해요
              </p>
            </div>
            <div
              style={{
                textAlign: 'center',
                padding: '1.5rem',
                background: '#FFEBEE',
                borderRadius: '16px',
                flex: '1',
                minWidth: '200px',
              }}
            >
              <div
                style={{
                  fontSize: '2.5rem',
                  marginBottom: '0.5rem',
                }}
              >
                💬
              </div>
              <h3 style={{ color: '#C62828', marginBottom: '0.5rem' }}>질문과 답변</h3>
              <p style={{ fontSize: '0.875rem', color: '#9E9E9E' }}>
                궁금한 것을 자유롭게 물어보세요
              </p>
            </div>
            <div
              style={{
                textAlign: 'center',
                padding: '1.5rem',
                background: '#FFF9E6',
                borderRadius: '16px',
                flex: '1',
                minWidth: '200px',
              }}
            >
              <div
                style={{
                  fontSize: '2.5rem',
                  marginBottom: '0.5rem',
                }}
              >
                👥
              </div>
              <h3 style={{ color: '#FFB300', marginBottom: '0.5rem' }}>커뮤니티</h3>
              <p style={{ fontSize: '0.875rem', color: '#9E9E9E' }}>
                함께 성장하는 교육 커뮤니티
              </p>
            </div>
          </div>
        </div>

        {isAuthenticated ? (
          <Link to="/feed">
            <Button size="lg">피드 보기</Button>
          </Link>
        ) : (
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login">
              <Button size="lg" variant="secondary">
                로그인
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg">회원가입</Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  )
}

export default Home
