import { create } from 'zustand'
import { Comment } from '../types'
import * as commentService from '../services/commentService'
import { socketService } from '../services/socketService'

interface CommentState {
  commentsByPostId: { [postId: string]: Comment[] }
  loading: boolean
  error: string | null

  // Actions
  fetchComments: (postId: string) => Promise<void>
  createComment: (postId: string, data: { content: string; parentCommentId?: string; mentions?: string[] }) => Promise<void>
  updateComment: (postId: string, commentId: string, content: string) => Promise<void>
  deleteComment: (postId: string, commentId: string) => Promise<void>
  clearError: () => void
  addCommentFromSocket: (postId: string, comment: Comment) => void
  addReplyFromSocket: (postId: string, parentCommentId: string, reply: Comment) => void
}

export const useCommentStore = create<CommentState>((set, get) => ({
  commentsByPostId: {},
  loading: false,
  error: null,

  fetchComments: async (postId: string) => {
    set({ loading: true, error: null })
    try {
      const response = await commentService.getComments(postId)
      set((state) => ({
        commentsByPostId: {
          ...state.commentsByPostId,
          [postId]: response.comments,
        },
        loading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '댓글을 불러오는데 실패했습니다.',
        loading: false,
      })
    }
  },

  createComment: async (postId: string, data: { content: string; parentCommentId?: string; mentions?: string[] }) => {
    set({ loading: true, error: null })
    try {
      const response = await commentService.createComment(postId, data)
      // 댓글 목록을 다시 불러와서 그룹화된 구조로 업데이트
      const commentsResponse = await commentService.getComments(postId)
      set((state) => ({
        commentsByPostId: {
          ...state.commentsByPostId,
          [postId]: commentsResponse.comments,
        },
        loading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '댓글 작성에 실패했습니다.',
        loading: false,
      })
      throw error
    }
  },

  updateComment: async (postId: string, commentId: string, content: string) => {
    set({ loading: true, error: null })
    try {
      const response = await commentService.updateComment(commentId, { content })
      set((state) => {
        const existingComments = state.commentsByPostId[postId] || []
        return {
          commentsByPostId: {
            ...state.commentsByPostId,
            [postId]: existingComments.map((comment) =>
              comment._id === commentId ? response.comment : comment
            ),
          },
          loading: false,
        }
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '댓글 수정에 실패했습니다.',
        loading: false,
      })
      throw error
    }
  },

  deleteComment: async (postId: string, commentId: string) => {
    set({ loading: true, error: null })
    try {
      await commentService.deleteComment(commentId)
      // 댓글 목록을 다시 불러와서 그룹화된 구조로 업데이트
      const commentsResponse = await commentService.getComments(postId)
      set((state) => ({
        commentsByPostId: {
          ...state.commentsByPostId,
          [postId]: commentsResponse.comments,
        },
        loading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '댓글 삭제에 실패했습니다.',
        loading: false,
      })
      throw error
    }
  },

  clearError: () => set({ error: null }),

  addCommentFromSocket: (postId: string, comment: Comment) => {
    set((state) => {
      const existingComments = state.commentsByPostId[postId] || []
      // 중복 체크
      const isDuplicate = existingComments.some((c) => c._id === comment._id)
      if (isDuplicate) {
        return state
      }
      
      // 새 댓글을 맨 뒤에 추가 (시간순 정렬)
      return {
        commentsByPostId: {
          ...state.commentsByPostId,
          [postId]: [...existingComments, comment],
        },
      }
    })
  },

  addReplyFromSocket: (postId: string, parentCommentId: string, reply: Comment) => {
    set((state) => {
      const existingComments = state.commentsByPostId[postId] || []
      const updatedComments = existingComments.map((comment) => {
        if (comment._id === parentCommentId) {
          // 부모 댓글 찾기
          const replies = comment.replies || []
          // 중복 체크
          const isDuplicate = replies.some((r) => r._id === reply._id)
          if (isDuplicate) {
            return comment
          }
          
          // 새 답글 추가
          return {
            ...comment,
            replies: [...replies, reply],
          }
        }
        return comment
      })
      
      return {
        commentsByPostId: {
          ...state.commentsByPostId,
          [postId]: updatedComments,
        },
      }
    })
  },
}))
