import { create } from 'zustand'
import * as likeService from '../services/likeService'

interface LikeStatus {
  count: number
  liked: boolean
}

interface LikeState {
  likesByPostId: { [postId: string]: LikeStatus }
  loading: boolean
  error: string | null

  // Actions
  fetchLikeStatus: (postId: string) => Promise<void>
  toggleLike: (postId: string) => Promise<void>
  clearError: () => void
}

export const useLikeStore = create<LikeState>((set, get) => ({
  likesByPostId: {},
  loading: false,
  error: null,

  fetchLikeStatus: async (postId: string) => {
    try {
      const response = await likeService.getLikeStatus(postId)
      set((state) => ({
        likesByPostId: {
          ...state.likesByPostId,
          [postId]: {
            count: response.count,
            liked: response.liked,
          },
        },
      }))
    } catch (error: any) {
      console.error('좋아요 상태 조회 실패:', error)
    }
  },

  toggleLike: async (postId: string) => {
    set({ loading: true, error: null })
    
    // Optimistic update
    const current = get().likesByPostId[postId]
    const optimisticLiked = current ? !current.liked : true
    const optimisticCount = current
      ? optimisticLiked
        ? current.count + 1
        : Math.max(0, current.count - 1)
      : 1

    set((state) => ({
      likesByPostId: {
        ...state.likesByPostId,
        [postId]: {
          count: optimisticCount,
          liked: optimisticLiked,
        },
      },
      loading: false,
    }))

    try {
      const response = await likeService.toggleLike(postId)
      // 서버 응답으로 실제 상태 업데이트
      set((state) => ({
        likesByPostId: {
          ...state.likesByPostId,
          [postId]: {
            count: response.count,
            liked: response.liked,
          },
        },
        loading: false,
      }))
    } catch (error: any) {
      // 실패 시 이전 상태로 롤백
      set((state) => ({
        likesByPostId: {
          ...state.likesByPostId,
          [postId]: current || { count: 0, liked: false },
        },
        error: error.response?.data?.message || '좋아요 처리에 실패했습니다.',
        loading: false,
      }))
      throw error
    }
  },

  clearError: () => set({ error: null }),
}))
