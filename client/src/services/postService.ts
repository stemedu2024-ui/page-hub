import api from './api'
import { Post } from '../types'

interface CreatePostData {
  type: 'general' | 'question'
  title?: string
  content: string
  images?: string[]
  videos?: string[]
  youtubeLink?: string
  visibility: 'private' | 'friends' | 'teachers' | 'friends_teachers' | 'public'
  targetTeacher?: string
}

interface UpdatePostData {
  title?: string
  content?: string
  images?: string[]
  videos?: string[]
  youtubeLink?: string
  visibility?: 'private' | 'friends' | 'teachers' | 'friends_teachers' | 'public'
  questionStatus?: 'pending' | 'answered'
}

interface CreatePostResponse {
  status: string
  message: string
  post: Post
}

interface GetFeedResponse {
  status: string
  posts: Post[]
}

interface GetPostResponse {
  status: string
  post: Post
}

interface UpdatePostResponse {
  status: string
  message: string
  post: Post
}

interface DeletePostResponse {
  status: string
  message: string
}

// 포스트 생성
export const createPost = async (data: CreatePostData): Promise<CreatePostResponse> => {
  const response = await api.post<CreatePostResponse>('/posts', data)
  return response.data
}

// 피드 조회
export const getFeed = async (): Promise<GetFeedResponse> => {
  const response = await api.get<GetFeedResponse>('/posts/feed')
  return response.data
}

// 단일 포스트 조회
export const getPostById = async (postId: string): Promise<GetPostResponse> => {
  const response = await api.get<GetPostResponse>(`/posts/${postId}`)
  return response.data
}

// 포스트 수정
export const updatePost = async (
  postId: string,
  data: UpdatePostData
): Promise<UpdatePostResponse> => {
  const response = await api.patch<UpdatePostResponse>(`/posts/${postId}`, data)
  return response.data
}

// 포스트 삭제
export const deletePost = async (postId: string): Promise<DeletePostResponse> => {
  const response = await api.delete<DeletePostResponse>(`/posts/${postId}`)
  return response.data
}

// Read 목록 조회 (Phase 7-A)
interface GetPostReadsResponse {
  status: string
  users: { userId: string; timestamp: string }[]
}

export const getPostReads = async (postId: string): Promise<GetPostReadsResponse> => {
  const response = await api.get<GetPostReadsResponse>(`/posts/${postId}/reads`)
  return response.data
}
