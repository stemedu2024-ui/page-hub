import api from './api'
import { User, Friendship } from '../types'

interface CreateFriendRequestData {
  recipientId: string
}

interface RespondFriendRequestData {
  response: 'accepted' | 'rejected'
}

interface FriendRequestResponse {
  status: string
  message: string
  friendship: Friendship
}

interface FriendsResponse {
  status: string
  friends: User[]
}

interface FriendRequestsResponse {
  status: string
  requests: Friendship[]
}

interface FriendRecommendationsResponse {
  status: string
  recommendations: User[]
}

interface FriendshipStatusResponse {
  status: string
  friendshipStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'rejected'
}

// 친구 요청 생성
export const createFriendRequest = async (
  data: CreateFriendRequestData
): Promise<Friendship> => {
  const response = await api.post<FriendRequestResponse>('/friends/request', data)
  return response.data.friendship
}

// 친구 요청 응답 (승인/거절)
export const respondFriendRequest = async (
  friendshipId: string,
  data: RespondFriendRequestData
): Promise<Friendship> => {
  const response = await api.patch<FriendRequestResponse>(
    `/friends/response/${friendshipId}`,
    data
  )
  return response.data.friendship
}

// 친구 목록 조회
export const getFriends = async (): Promise<User[]> => {
  const response = await api.get<FriendsResponse>('/friends/list')
  return response.data.friends
}

// 받은 친구 요청 목록 조회
export const getReceivedRequests = async (): Promise<Friendship[]> => {
  const response = await api.get<FriendRequestsResponse>('/friends/received')
  return response.data.requests
}

// 보낸 친구 요청 목록 조회
export const getSentRequests = async (): Promise<Friendship[]> => {
  const response = await api.get<FriendRequestsResponse>('/friends/sent')
  return response.data.requests
}

// 친구 추천 조회
export const getFriendRecommendations = async (): Promise<User[]> => {
  const response = await api.get<FriendRecommendationsResponse>('/friends/recommend')
  return response.data.recommendations
}

// 친구 상태 확인
export const getFriendshipStatus = async (
  userId: string
): Promise<'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'rejected'> => {
  const response = await api.get<FriendshipStatusResponse>(`/friends/status/${userId}`)
  return response.data.friendshipStatus
}

// 사용자 검색
interface SearchUsersResponse {
  status: string
  users: User[]
  total: number
}

export const searchUsers = async (query: string, limit: number = 20): Promise<SearchUsersResponse> => {
  const response = await api.get<SearchUsersResponse>('/friends/search', {
    params: { query, limit },
  })
  return response.data
}

// 친구 끊기
interface UnfriendResponse {
  status: string
  message: string
}

export const unfriend = async (targetUserId: string): Promise<UnfriendResponse> => {
  const response = await api.delete<UnfriendResponse>(`/friends/unfriend/${targetUserId}`)
  return response.data
}
