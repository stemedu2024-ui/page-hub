import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePostStore } from '../store/postStore'
import { useAuthStore } from '../store/authStore'
import { Input, Textarea } from '../components/InputForm'
import Button from '../components/Button'
import Card from '../components/Card'
import { VISIBILITY_OPTIONS } from '../constants'

const CreatePostPage = () => {
  const navigate = useNavigate()
  const { createPost, loading, error } = usePostStore()
  const { user } = useAuthStore()
  const [formData, setFormData] = useState({
    type: 'general' as 'general' | 'question',
    title: '',
    content: '',
    images: [] as string[],
    videos: [] as string[],
    youtubeLink: '',
    visibility: 'public' as 'private' | 'friends' | 'teachers' | 'friends_teachers' | 'public',
    targetTeacher: '',
  })

  const [imageInput, setImageInput] = useState('')
  const [videoInput, setVideoInput] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.content.trim()) {
      alert('내용을 입력해주세요.')
      return
    }

    if (formData.type === 'question' && !formData.title.trim()) {
      alert('질문 포스트는 제목이 필요합니다.')
      return
    }

    try {
      const postData: any = {
        type: formData.type,
        content: formData.content,
        visibility: formData.visibility,
      }

      if (formData.type === 'question') {
        postData.title = formData.title
        if (formData.targetTeacher) {
          postData.targetTeacher = formData.targetTeacher
        }
      }

      if (formData.images.length > 0) postData.images = formData.images
      if (formData.videos.length > 0) postData.videos = formData.videos
      if (formData.youtubeLink) postData.youtubeLink = formData.youtubeLink

      await createPost(postData)
      navigate('/feed')
    } catch (err) {
      console.error('Create post error:', err)
    }
  }

  const handleAddImage = () => {
    if (imageInput.trim()) {
      setFormData({
        ...formData,
        images: [...formData.images, imageInput.trim()],
      })
      setImageInput('')
    }
  }

  const handleRemoveImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    })
  }

  const handleAddVideo = () => {
    if (videoInput.trim()) {
      setFormData({
        ...formData,
        videos: [...formData.videos, videoInput.trim()],
      })
      setVideoInput('')
    }
  }

  const handleRemoveVideo = (index: number) => {
    setFormData({
      ...formData,
      videos: formData.videos.filter((_, i) => i !== index),
    })
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem' }} className="fade-in">
      <Card>
        <h2
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #66BB6A 0%, #FFB300 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '1.5rem',
          }}
        >
          ✏️ 포스트 작성
        </h2>
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
          <div style={{ marginBottom: '1rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#388E3C',
              }}
            >
              포스트 타입 *
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value as 'general' | 'question' })
              }
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '2px solid #E0E0E0',
                borderRadius: '12px',
                fontSize: '1rem',
                background: '#FFFFFF',
                transition: 'all 0.2s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#66BB6A'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 187, 106, 0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#E0E0E0'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <option value="general">일반 포스트</option>
              <option value="question">질문 포스트</option>
            </select>
          </div>

          {formData.type === 'question' && (
            <Input
              type="text"
              label="제목 *"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          )}

          <Textarea
            label="내용 *"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={6}
            required
          />

          <div style={{ marginBottom: '1rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#388E3C',
              }}
            >
              이미지 URL
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                placeholder="이미지 URL 입력"
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '0.75rem 1rem',
                  border: '2px solid #E0E0E0',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  transition: 'all 0.2s ease',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#66BB6A'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 187, 106, 0.1)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E0E0E0'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
              <Button type="button" onClick={handleAddImage} size="sm">
                추가
              </Button>
            </div>
            {formData.images.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                {formData.images.map((img, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.25rem',
                      backgroundColor: '#f0f0f0',
                      borderRadius: '4px',
                      marginTop: '0.25rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.875rem',
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {img}
                    </span>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => handleRemoveImage(index)}
                      size="sm"
                    >
                      삭제
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#388E3C',
              }}
            >
              영상 URL
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={videoInput}
                onChange={(e) => setVideoInput(e.target.value)}
                placeholder="영상 URL 입력"
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '0.75rem 1rem',
                  border: '2px solid #E0E0E0',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  transition: 'all 0.2s ease',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#66BB6A'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 187, 106, 0.1)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E0E0E0'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
              <Button type="button" onClick={handleAddVideo} size="sm">
                추가
              </Button>
            </div>
            {formData.videos.length > 0 && (
              <div style={{ marginTop: '0.55rem' }}>
                {formData.videos.map((vid, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.25rem',
                      backgroundColor: '#F5F5F5',
                      borderRadius: '8px',
                      marginTop: '0.5rem',
                      gap: '0.5rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.875rem',
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {vid}
                    </span>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => handleRemoveVideo(index)}
                      size="sm"
                    >
                      삭제
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Input
            type="text"
            label="YouTube 링크"
            value={formData.youtubeLink}
            onChange={(e) => setFormData({ ...formData, youtubeLink: e.target.value })}
            placeholder="https://www.youtube.com/watch?v=..."
          />

          <div style={{ marginBottom: '1rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#388E3C',
              }}
            >
              공개 범위 *
            </label>
            <select
              value={formData.visibility}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  visibility: e.target.value as typeof formData.visibility,
                })
              }
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '2px solid #E0E0E0',
                borderRadius: '12px',
                fontSize: '1rem',
                background: '#FFFFFF',
                transition: 'all 0.2s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#66BB6A'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 187, 106, 0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#E0E0E0'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {VISIBILITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              marginTop: '1rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid rgba(255, 224, 130, 0.3)',
            }}
          >
            <Button type="submit" style={{ flex: 1 }} disabled={loading} size="lg">
              {loading ? '작성 중...' : '✨ 작성하기'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/feed')}
              disabled={loading}
              size="lg"
            >
              취소
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default CreatePostPage
