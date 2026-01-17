import { Response, NextFunction } from 'express'
import * as notificationService from '../services/notificationService'
import { AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'

// 알림 목록 조회
export const getNotifications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다.', 401)
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50
    const notifications = await notificationService.getUserNotifications(req.user.id, limit)

    res.status(200).json({
      status: 'success',
      notifications,
    })
  } catch (error) {
    next(error)
  }
}

// 읽지 않은 알림 개수 조회
export const getUnreadCount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다.', 401)
    }

    const count = await notificationService.getUnreadCount(req.user.id)

    res.status(200).json({
      status: 'success',
      unreadCount: count,
    })
  } catch (error) {
    next(error)
  }
}

// 알림 읽음 처리
export const markAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다.', 401)
    }

    const { id } = req.params
    const notification = await notificationService.markAsRead(id, req.user.id)

    res.status(200).json({
      status: 'success',
      message: '알림이 읽음 처리되었습니다.',
      notification,
    })
  } catch (error) {
    next(error)
  }
}

// 모든 알림 읽음 처리
export const markAllAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다.', 401)
    }

    await notificationService.markAllAsRead(req.user.id)

    res.status(200).json({
      status: 'success',
      message: '모든 알림이 읽음 처리되었습니다.',
    })
  } catch (error) {
    next(error)
  }
}

// 알림 삭제
export const deleteNotification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다.', 401)
    }

    const { id } = req.params
    await notificationService.deleteNotification(id, req.user.id)

    res.status(200).json({
      status: 'success',
      message: '알림이 삭제되었습니다.',
    })
  } catch (error) {
    next(error)
  }
}
