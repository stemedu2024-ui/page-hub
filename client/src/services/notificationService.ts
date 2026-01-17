import api from './api'
import { Notification } from '../types'

interface GetNotificationsResponse {
  status: string
  notifications: Notification[]
}

interface GetUnreadCountResponse {
  status: string
  unreadCount: number
}

interface MarkAsReadResponse {
  status: string
  message: string
  notification: Notification
}

interface MarkAllAsReadResponse {
  status: string
  message: string
}

interface DeleteNotificationResponse {
  status: string
  message: string
}

// 알림 목록 조회
export const getNotifications = async (limit?: number): Promise<GetNotificationsResponse> => {
  const params = limit ? `?limit=${limit}` : ''
  const response = await api.get<GetNotificationsResponse>(`/notifications${params}`)
  return response.data
}

// 읽지 않은 알림 개수 조회
export const getUnreadCount = async (): Promise<GetUnreadCountResponse> => {
  const response = await api.get<GetUnreadCountResponse>('/notifications/unread-count')
  return response.data
}

// 알림 읽음 처리
export const markAsRead = async (id: string): Promise<MarkAsReadResponse> => {
  const response = await api.patch<MarkAsReadResponse>(`/notifications/${id}/read`)
  return response.data
}

// 모든 알림 읽음 처리
export const markAllAsRead = async (): Promise<MarkAllAsReadResponse> => {
  const response = await api.patch<MarkAllAsReadResponse>('/notifications/read-all')
  return response.data
}

// 알림 삭제
export const deleteNotification = async (id: string): Promise<DeleteNotificationResponse> => {
  const response = await api.delete<DeleteNotificationResponse>(`/notifications/${id}`)
  return response.data
}
