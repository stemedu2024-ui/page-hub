import { Notification } from '../models/Notification'
import { User } from '../models/User'
import { INotification, NotificationType } from '../types'
import { AppError } from '../middleware/errorHandler'
import { getIO, getActiveUsersByPost } from '../utils/socket'

interface CreateNotificationData {
  user: string // recipient
  relatedUser?: string // sender
  relatedPost?: string
  relatedComment?: string
  type: NotificationType
  message: string
}

// 알림 생성
export const createNotification = async (
  data: CreateNotificationData
): Promise<INotification> => {
  // 자기 자신에게 알림을 보내지 않도록 확인
  if (data.user === data.relatedUser) {
    throw new AppError('자기 자신에게 알림을 보낼 수 없습니다.', 400)
  }

  // 수신자 존재 확인
  const recipient = await User.findById(data.user)
  if (!recipient) {
    throw new AppError('알림 수신자를 찾을 수 없습니다.', 404)
  }

  // 알림 생성
  const notification = new Notification({
    user: data.user,
    relatedUser: data.relatedUser,
    relatedPost: data.relatedPost,
    relatedComment: data.relatedComment,
    type: data.type,
    message: data.message,
    read: false,
  })

  await notification.save()
  
  const notificationObj = notification.toObject() as INotification

  // Socket.IO 이벤트 emit (Notification 중복 방지)
  try {
    // post 관련 알림 타입 체크
    const postRelatedTypes: NotificationType[] = ['comment', 'reply', 'question_answer', 'question_comment']
    const isPostRelated = data.relatedPost && postRelatedTypes.includes(data.type)

    // post 관련 알림이고, 수신자가 현재 해당 post room에 있으면 socket emit 생략
    let shouldEmitSocket = true
    if (isPostRelated && data.relatedPost) {
      try {
        const activeUsersInPost = getActiveUsersByPost(data.relatedPost)
        // 수신자가 현재 post room에 있으면 socket emit 생략 (이미 실시간으로 댓글/답글을 보고 있음)
        if (activeUsersInPost.includes(data.user)) {
          shouldEmitSocket = false
        }
      } catch (error) {
        // presence 체크 실패 시에는 기존처럼 emit (안전한 fallback)
        // 에러 로그는 남기지 않음 (필수 동작이 아니므로)
      }
    }

    // socket emit이 필요한 경우에만 전송
    if (shouldEmitSocket) {
      const io = getIO()
      const notificationData = {
        _id: notificationObj._id,
        type: notificationObj.type,
        message: notificationObj.message,
        relatedPost: notificationObj.relatedPost,
        relatedUser: notificationObj.relatedUser,
        relatedComment: notificationObj.relatedComment,
        read: notificationObj.read,
        createdAt: notificationObj.createdAt,
      }
      
      // 수신자에게만 알림 전송
      io.to(`user:${data.user}`).emit('notification:new', notificationData)
    }
  } catch (error) {
    // Socket.IO 에러는 알림 생성을 막지 않음
    console.error('Socket.IO 알림 이벤트 emit 실패:', error)
  }

  return notificationObj
}

// 사용자 알림 목록 조회
export const getUserNotifications = async (
  userId: string,
  limit: number = 50
): Promise<INotification[]> => {
  const notifications = await Notification.find({ user: userId })
    .populate('relatedUser', 'id name nickname role class')
    .populate('relatedPost', 'title content type')
    .sort({ createdAt: -1 })
    .limit(limit)
    .exec()

  return notifications.map((notification) => notification.toObject() as INotification)
}

// 알림 읽음 처리
export const markAsRead = async (
  notificationId: string,
  userId: string
): Promise<INotification> => {
  const notification = await Notification.findById(notificationId)
  if (!notification) {
    throw new AppError('알림을 찾을 수 없습니다.', 404)
  }

  // 본인의 알림인지 확인
  if (notification.user.toString() !== userId) {
    throw new AppError('알림을 읽을 권한이 없습니다.', 403)
  }

  notification.read = true
  await notification.save()

  await notification.populate('relatedUser', 'id name nickname role class')
  await notification.populate('relatedPost', 'title content type')

  return notification.toObject() as INotification
}

// 모든 알림 읽음 처리
export const markAllAsRead = async (userId: string): Promise<void> => {
  await Notification.updateMany({ user: userId, read: false }, { read: true })
}

// 알림 삭제
export const deleteNotification = async (
  notificationId: string,
  userId: string
): Promise<void> => {
  const notification = await Notification.findById(notificationId)
  if (!notification) {
    throw new AppError('알림을 찾을 수 없습니다.', 404)
  }

  // 본인의 알림인지 확인
  if (notification.user.toString() !== userId) {
    throw new AppError('알림을 삭제할 권한이 없습니다.', 403)
  }

  await Notification.findByIdAndDelete(notificationId)
}

// 읽지 않은 알림 개수 조회
export const getUnreadCount = async (userId: string): Promise<number> => {
  const count = await Notification.countDocuments({ user: userId, read: false })
  return count
}
