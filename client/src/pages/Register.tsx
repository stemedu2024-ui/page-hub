import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '../components/InputForm'
import Button from '../components/Button'
import Card from '../components/Card'
import { useAuthStore } from '../store/authStore'

const Register = () => {
  const navigate = useNavigate()
  const register = useAuthStore((state) => state.register)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    nickname: '',
    password: '',
    confirmPassword: '',
    class: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      setLoading(false)
      return
    }

    // ID 검증 (영문/숫자만, 3-20자)
    const idRegex = /^[a-zA-Z0-9]{3,20}$/
    if (!idRegex.test(formData.id)) {
      setError('ID는 3자 이상 20자 이하의 영문/숫자만 사용 가능합니다.')
      setLoading(false)
      return
    }

    // 최소 길이 검증
    if (formData.name.length < 2) {
      setError('이름은 최소 2자 이상이어야 합니다.')
      setLoading(false)
      return
    }

    if (formData.nickname.length < 2) {
      setError('닉네임은 최소 2자 이상이어야 합니다.')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.')
      setLoading(false)
      return
    }

    try {
      const registerData = {
        id: formData.id,
        name: formData.name,
        nickname: formData.nickname,
        password: formData.password,
        class: formData.class ? parseInt(formData.class) : undefined,
      }

      await register(registerData)
      navigate('/')
    } catch (err: any) {
      setError(err.message || '회원가입에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div
      style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '2rem',
        minHeight: 'calc(100vh - 200px)',
      }}
      className="fade-in"
    >
      <Card
        style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF9E6 100%)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #66BB6A 0%, #388E3C 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              boxShadow: '0 4px 12px rgba(102, 187, 106, 0.3)',
            }}
          >
            <span style={{ fontSize: '2.5rem' }}>✨</span>
          </div>
          <h2
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #66BB6A 0%, #FFB300 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '0.5rem',
            }}
          >
            회원가입
          </h2>
          <p style={{ color: '#9E9E9E', fontSize: '0.875rem' }}>
            PageHub 커뮤니티에 함께해요
          </p>
        </div>

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
        <form onSubmit={handleSubmit}>
          <Input
            type="text"
            name="id"
            label="ID * (영문/숫자, 3-20자)"
            value={formData.id}
            onChange={handleChange}
            required
            placeholder="예: student123"
          />
          <Input
            type="text"
            name="name"
            label="이름 *"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <Input
            type="text"
            name="nickname"
            label="닉네임 *"
            value={formData.nickname}
            onChange={handleChange}
            required
          />

          <Input
            type="password"
            name="password"
            label="비밀번호 * (최소 6자)"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <Input
            type="password"
            name="confirmPassword"
            label="비밀번호 확인 *"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />

          <Input
            type="number"
            name="class"
            label="수강 반 (선택)"
            value={formData.class}
            onChange={handleChange}
            min="1"
            placeholder="예: 1"
          />

          <Button type="submit" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? '처리 중...' : '회원가입'}
          </Button>
        </form>

        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(255, 224, 130, 0.3)',
            textAlign: 'center',
          }}
        >
          <p style={{ color: '#9E9E9E', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            이미 계정이 있으신가요?
          </p>
          <Button
            variant="outline"
            onClick={() => navigate('/login')}
            style={{ width: '100%' }}
          >
            로그인
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default Register
