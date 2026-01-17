import { create } from 'zustand'
import { Post } from '../types'
import * as postService from '../services/postService'

interface PostState {
  posts: Post[]
  currentPost: Post | null
  loading: boolean
  postLoading: boolean
  error: string | null
  fetchFeed: () => Promise<void>
  fetchPostById: (postId: string) => Promise<void>
  createPost: (data: {
    type: 'general' | 'question'
    title?: string
    content: string
    images?: string[]
    videos?: string[]
    youtubeLink?: string
    visibility: 'private' | 'friends' | 'teachers' | 'friends_teachers' | 'public'
    targetTeacher?: string
  }) => Promise<void>
  updatePost: (
    postId: string,
    data: {
      title?: string
      content?: string
      images?: string[]
      videos?: string[]
      youtubeLink?: string
      visibility?: 'private' | 'friends' | 'teachers' | 'friends_teachers' | 'public'
      questionStatus?: 'pending' | 'answered'
    }
  ) => Promise<void>
  deletePost: (postId: string) => Promise<void>
  clearCurrentPost: () => void
  clearError: () => void
}

export const usePostStore = create<PostState>((set, get) => ({
  posts: [],
  currentPost: null,
  loading: false,
  postLoading: false,
  error: null,

  fetchFeed: async () => {
    set({ loading: true, error: null })
    try {
      const response = await postService.getFeed()
      set({ posts: response.posts, loading: false })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '피드를 불러오는데 실패했습니다.',
        loading: false,
      })
    }
  },

  fetchPostById: async (postId: string) => {
    // 먼저 피드에 있는지 확인
    const existingPost = get().posts.find((p) => p._id === postId)
    if (existingPost) {
      set({ currentPost: existingPost, postLoading: false })
      return
    }

    // 피드에 없으면 API 호출
    set({ postLoading: true, error: null })
    try {
      const response = await postService.getPostById(postId)
      set({ currentPost: response.post, postLoading: false })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '포스트를 불러오는데 실패했습니다.',
        postLoading: false,
        currentPost: null,
      })
      throw error
    }
  },

  createPost: async (data) => {
    set({ loading: true, error: null })
    try {
      const response = await postService.createPost(data)
      set((state) => ({
        posts: [response.post, ...state.posts],
        loading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '포스트 작성에 실패했습니다.',
        loading: false,
      })
      throw error
    }
  },

  updatePost: async (postId, data) => {
    set({ loading: true, error: null })
    try {
      const response = await postService.updatePost(postId, data)
      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === postId ? response.post : post
        ),
        loading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '포스트 수정에 실패했습니다.',
        loading: false,
      })
      throw error
    }
  },

  deletePost: async (postId) => {
    set({ loading: true, error: null })
    try {
      await postService.deletePost(postId)
      set((state) => ({
        posts: state.posts.filter((post) => post._id !== postId),
        loading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '포스트 삭제에 실패했습니다.',
        loading: false,
      })
      throw error
    }
  },

  clearCurrentPost: () => set({ currentPost: null }),
  clearError: () => set({ error: null }),
}))
