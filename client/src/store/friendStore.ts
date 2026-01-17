import { create } from 'zustand'
import { User, Friendship } from '../types'
import * as friendService from '../services/friendService'

interface FriendState {
  friends: User[]
  receivedRequests: Friendship[]
  sentRequests: Friendship[]
  recommendations: User[]
  searchResults: User[]
  searchQuery: string
  loading: boolean
  searchLoading: boolean
  error: string | null
  searchError: string | null
  
  // Actions
  fetchFriends: () => Promise<void>
  fetchReceivedRequests: () => Promise<void>
  fetchSentRequests: () => Promise<void>
  fetchRecommendations: () => Promise<void>
  searchUsers: (query: string) => Promise<void>
  clearSearchResults: () => void
  sendFriendRequest: (recipientId: string) => Promise<void>
  respondToRequest: (friendshipId: string, response: 'accepted' | 'rejected') => Promise<void>
  unfriend: (targetUserId: string) => Promise<void>
  getFriendshipStatus: (userId: string) => Promise<'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'rejected'>
  clearError: () => void
}

export const useFriendStore = create<FriendState>((set, get) => ({
  friends: [],
  receivedRequests: [],
  sentRequests: [],
  recommendations: [],
  searchResults: [],
  searchQuery: '',
  loading: false,
  searchLoading: false,
  error: null,
  searchError: null,

  fetchFriends: async () => {
    set({ loading: true, error: null })
    try {
      const friends = await friendService.getFriends()
      set({ friends, loading: false })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '친구 목록을 불러오는데 실패했습니다.',
        loading: false,
      })
    }
  },

  fetchReceivedRequests: async () => {
    set({ loading: true, error: null })
    try {
      const requests = await friendService.getReceivedRequests()
      set({ receivedRequests: requests, loading: false })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '받은 친구 요청을 불러오는데 실패했습니다.',
        loading: false,
      })
    }
  },

  fetchSentRequests: async () => {
    set({ loading: true, error: null })
    try {
      const requests = await friendService.getSentRequests()
      set({ sentRequests: requests, loading: false })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '보낸 친구 요청을 불러오는데 실패했습니다.',
        loading: false,
      })
    }
  },

  fetchRecommendations: async () => {
    set({ loading: true, error: null })
    try {
      const recommendations = await friendService.getFriendRecommendations()
      set({ recommendations, loading: false })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '친구 추천을 불러오는데 실패했습니다.',
        loading: false,
      })
    }
  },

  searchUsers: async (query: string) => {
    if (!query || query.trim().length < 2) {
      set({ searchResults: [], searchQuery: '', searchLoading: false })
      return
    }

    set({ searchLoading: true, searchError: null, searchQuery: query })
    try {
      const response = await friendService.searchUsers(query.trim(), 20)
      set({ searchResults: response.users, searchLoading: false })
    } catch (error: any) {
      set({
        searchError: error.response?.data?.message || '검색에 실패했습니다.',
        searchLoading: false,
      })
    }
  },

  clearSearchResults: () => {
    set({ searchResults: [], searchQuery: '', searchError: null })
  },

  sendFriendRequest: async (recipientId: string) => {
    set({ loading: true, error: null })
    try {
      await friendService.createFriendRequest({ recipientId })
      // 요청 목록 새로고침
      await get().fetchSentRequests()
      await get().fetchRecommendations()
      set({ loading: false })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '친구 요청을 보내는데 실패했습니다.',
        loading: false,
      })
      throw error
    }
  },

  respondToRequest: async (friendshipId: string, response: 'accepted' | 'rejected') => {
    set({ loading: true, error: null })
    try {
      await friendService.respondFriendRequest(friendshipId, { response })
      // 목록 새로고침
      await get().fetchReceivedRequests()
      await get().fetchFriends()
      set({ loading: false })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '친구 요청 응답에 실패했습니다.',
        loading: false,
      })
      throw error
    }
  },

  unfriend: async (targetUserId: string) => {
    set({ loading: true, error: null })
    try {
      await friendService.unfriend(targetUserId)
      // 친구 목록 새로고침
      await get().fetchFriends()
      // 검색 결과가 있다면 상태 업데이트
      if (get().searchResults.length > 0) {
        await get().searchUsers(get().searchQuery)
      }
      set({ loading: false })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '친구 끊기에 실패했습니다.',
        loading: false,
      })
      throw error
    }
  },

  getFriendshipStatus: async (userId: string) => {
    try {
      const status = await friendService.getFriendshipStatus(userId)
      return status
    } catch (error: any) {
      console.error('친구 상태 확인 실패:', error)
      return 'none'
    }
  },

  clearError: () => set({ error: null }),
}))
