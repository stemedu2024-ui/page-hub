import { create } from 'zustand'
import { Notification } from '../types'
import * as notificationService from '../services/notificationService'
import { socketService } from '../services/socketService'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null

  // Actions
  fetchNotifications: (limit?: number) => Promise<void>
  fetchUnreadCount: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  clearError: () => void
  addNotificationFromSocket: (notification: Notification) => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,

  fetchNotifications: async (limit?: number) => {
    set({ loading: true, error: null })
    try {
      const response = await notificationService.getNotifications(limit)
      set({ notifications: response.notifications, loading: false })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '알림을 불러오는데 실패했습니다.',
        loading: false,
      })
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await notificationService.getUnreadCount()
      set({ unreadCount: response.unreadCount })
    } catch (error: any) {
      console.error('읽지 않은 알림 개수 조회 실패:', error)
    }
  },

  markAsRead: async (id: string) => {
    try {
      await notificationService.markAsRead(id)
      set((state) => ({
        notifications: state.notifications.map((notif) =>
          notif._id === id ? { ...notif, read: true } : notif
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '알림 읽음 처리에 실패했습니다.',
      })
      throw error
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationService.markAllAsRead()
      set((state) => ({
        notifications: state.notifications.map((notif) => ({ ...notif, read: true })),
        unreadCount: 0,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '알림 읽음 처리에 실패했습니다.',
      })
      throw error
    }
  },

  deleteNotification: async (id: string) => {
    try {
      await notificationService.deleteNotification(id)
      set((state) => {
        const deleted = state.notifications.find((notif) => notif._id === id)
        return {
          notifications: state.notifications.filter((notif) => notif._id !== id),
          unreadCount: deleted && !deleted.read ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
        }
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '알림 삭제에 실패했습니다.',
      })
      throw error
    }
  },

  clearError: () => set({ error: null }),

  addNotificationFromSocket: (notification: Notification) => {
    set((state) => {
      // 중복 체크
      const isDuplicate = state.notifications.some((n) => n._id === notification._id)
      if (isDuplicate) {
        return state
      }
      
      // 새 알림을 맨 앞에 추가
      return {
        notifications: [notification, ...state.notifications],
        unreadCount: notification.read ? state.unreadCount : state.unreadCount + 1,
      }
    })
  },
}))
