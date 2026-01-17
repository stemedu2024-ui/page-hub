import api from './api'

interface LikeStatusResponse {
  status: string
  liked: boolean
  count: number
  message?: string
}

// 좋아요 토글
export const toggleLike = async (postId: string): Promise<LikeStatusResponse> => {
  const response = await api.post<LikeStatusResponse>(`/posts/${postId}/like`)
  return response.data
}

// 좋아요 상태 조회
export const getLikeStatus = async (postId: string): Promise<LikeStatusResponse> => {
  const response = await api.get<LikeStatusResponse>(`/posts/${postId}/like`)
  return response.data
}
