import api from './api'
import { Comment } from '../types'

interface CreateCommentData {
  content: string
  parentCommentId?: string
  mentions?: string[]
}

interface CreateCommentResponse {
  status: string
  message: string
  comment: Comment
}

interface GetCommentsResponse {
  status: string
  comments: Comment[]
}

interface UpdateCommentResponse {
  status: string
  message: string
  comment: Comment
}

interface DeleteCommentResponse {
  status: string
  message: string
}

// 댓글 작성
export const createComment = async (
  postId: string,
  data: CreateCommentData
): Promise<CreateCommentResponse> => {
  const response = await api.post<CreateCommentResponse>(`/comments/${postId}`, data)
  return response.data
}

// 댓글 목록 조회
export const getComments = async (postId: string): Promise<GetCommentsResponse> => {
  const response = await api.get<GetCommentsResponse>(`/comments/${postId}`)
  return response.data
}

// 댓글 수정
export const updateComment = async (
  commentId: string,
  data: CreateCommentData
): Promise<UpdateCommentResponse> => {
  const response = await api.patch<UpdateCommentResponse>(`/comments/${commentId}`, data)
  return response.data
}

// 댓글 삭제
export const deleteComment = async (commentId: string): Promise<DeleteCommentResponse> => {
  const response = await api.delete<DeleteCommentResponse>(`/comments/${commentId}`)
  return response.data
}

// 댓글 좋아요 토글
interface ToggleCommentLikeResponse {
  status: string
  liked: boolean
  count: number
}

export const toggleCommentLike = async (commentId: string): Promise<ToggleCommentLikeResponse> => {
  const response = await api.post<ToggleCommentLikeResponse>(`/comments/${commentId}/like`)
  return response.data
}
