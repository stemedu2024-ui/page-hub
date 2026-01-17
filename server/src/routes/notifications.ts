import { Router } from 'express'
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notificationController'
import { authenticate } from '../middleware/auth'

const router = Router()

// 모든 알림 관련 라우트는 인증 필요
router.use(authenticate)

// 알림 목록 조회
router.get('/', getNotifications)

// 읽지 않은 알림 개수 조회
router.get('/unread-count', getUnreadCount)

// 알림 읽음 처리
router.patch('/:id/read', markAsRead)

// 모든 알림 읽음 처리
router.patch('/read-all', markAllAsRead)

// 알림 삭제
router.delete('/:id', deleteNotification)

export default router
